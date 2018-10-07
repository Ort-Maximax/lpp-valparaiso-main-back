
'use strict';

const fs = require('fs');
const rimraf = require('rimraf');
const fileUpload = require('express-fileupload');
const pathLib = require('path');
const PythonShell = require('python-shell');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const request = require('request');

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://dev-438691.oktapreview.com/oauth2/default',
});

const authorizedFFMPEGActions = ['hflip', 'vflip', 'convert_mp4_h264'];

// Auth middleware
const authenticationRequired = (req, res, next) => {
  if (req.token) {
    return oktaJwtVerifier.verifyAccessToken(req.token)
      .then((jwt) => {
        req.jwt = jwt;
        next();
      })
      .catch((err) => {
        res.status(401).send(err.message);
      });
  } else {
    res.status(401).send('None shall pass');
  }
};

const appRouter = (app) => {
  app.use(fileUpload());

  const updateClient = (req) => {
    if (req.app.socket) {
      req.app.socket.emit(`dataChange${req.token}`);
    }
  };

  const sendSeekable = require('send-seekable');
  app.get('/getData', authenticationRequired, (req, res) => {
    PythonShell.run('Tree.py',
      { args: [`datas/${req.jwt.claims.sub}`] },
      // args: ['datas/user1'] },
      (err, results) => {
        if (err) throw err;
        return res.status(200).send(results[0]);
      });
  });

  app.get('/streamFile', sendSeekable, (req, res) => {
    const pathPrefix = `${process.cwd()}/datas`;
    const path = `${pathPrefix}/${req.query.path}`;
    if (fs.existsSync(path)){
      fs.stat(path, function(error, stat) {
        if (error) { throw error; }
        const stream = fs.createReadStream(path);
        res.sendSeekable(stream, { length: stat.size});
      });
    } else {
      return res.status(400).send('File not found');
    }
  });

  app.post('/removeElement', authenticationRequired, (req, res) => {
    const pathPrefix = `${process.cwd()}/datas`;
    req.body.forEach((path) => {
      path = `${pathPrefix}/${path}`;
      if (fs.existsSync(path)) {

        fs.stat(path, (error, stat) => {
          if (error) { throw error; }
          if (stat.isDirectory()){
            rimraf(path);
          } else {
            fs.unlinkSync(path);
          }
        });
      }
    });
    updateClient(req);
    return res.status(200).send('File deleted');
  });

  app.get('/downloadFile', authenticationRequired, (req, res) => {
    const pathPrefix = `${process.cwd()}/datas`;
    const path = `${pathPrefix}/${req.query.path}`;
    if (fs.existsSync(path)){
      res.download(path);
      return res.status(200);
    }
    return res.status(400).send('File not found');

  });

  app.put('/uploadFile', authenticationRequired, (req, res) => {
    if (!req.files || !req.body.path) {
      return res.status(400).send('Missing file data');
    }
    const file = req.files.data;
    let path = req.body.path;
    let i = 1;
    while (fs.existsSync(`./datas/${path}`)){
      path = `${req.body.path} (${i})`;
    }
    file.mv(`./datas/${path}`, function(err) {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }
      updateClient(req);
      return res.status(200).send('File uploaded!');
    });
  });

  app.post('/createDirectory', authenticationRequired, (req, res) => {
    let dirPath = `./datas/${req.body.path}/Nouveau dossier`;
    if (!fs.existsSync(dirPath)){
      fs.mkdirSync(dirPath);
    } else {
      let i = 1;
      while (fs.existsSync(dirPath)){
        dirPath = `./datas/${req.body.path}/Nouveau dossier (${i})`;
        i++;
      }
      fs.mkdirSync(dirPath);
    }
    updateClient(req);
    return res.status(200).send('New directory created');
  });

  app.post('/renameElement', authenticationRequired, (req, res) => {
    const elPath = `./datas/${req.body.path}`;
    if (fs.existsSync(elPath)){
      const arrPath = elPath.split('/');
      arrPath[arrPath.length - 1] = req.body.newName;
      const newPath = arrPath.join('/');

      fs.rename(`./datas/${req.body.path}`,
        `${newPath}`, function(err) {
          if (err){
            console.log('ERROR: ' + err);
            return res.status(501).send('Error renaming element');
          }
          updateClient(req);
          return res.status(200).send('Element renamed successfully');
        });

    } else {
      return res.status(500).send('Error renaming element');
    }
  });

  /**
   * paramètres à envoyer:
   *  {
   *    "method":"hflip | vflip | convert_mp4_h264",
   *    "input":"FICHIER_SOURCE",
   *    "output":"FICHIER_DESTINATION"
   *  }
   */
  app.post('/ffmpegAction', (req, res) => {
    // fichier source
    let input = `./datas/${req.body.input}`;

    // action ffmpeg à exécuter
    let method = req.body.method;

    if (!authorizedFFMPEGActions.includes(method))
      return res.status(400).send('FFMPEG action unauthorized');

    if (!fs.existsSync(input))
      return res.status(400).send('File not found');

    // préparation du nouveau fichier
    let fullInput = pathLib.resolve(input);
    let outputExtension = pathLib.extname(fullInput);
    let outputFile = pathLib.basename(fullInput, outputExtension);
    let outputPath = pathLib.dirname(fullInput);
    let output = pathLib.format({
      dir: outputPath,
      name: `${outputFile}.${method}`,
      ext: outputExtension,
    });
    // JSON à envoyer au WS
    let jsonToSend = {
      method: method,
      input: fullInput,
      output: output,
    };
    let stringifiedJson = JSON.stringify(jsonToSend);
    // let ffmpegWsUrl = process.env.FFMPEG_API_URL;
    let ffmpegWsUrl = 'http://localhost:5000/ffmpeg';
    request.post({
      uri: ffmpegWsUrl,
      body: stringifiedJson,
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        console.log('BODY: ' + body);
        return res.status(200).send('FFMPEG action sent');
      } else {
        console.log(body);
        console.log(error);
        return res.status(500).send('FFMPEG unreachable');
      }
    });
  });
};

module.exports = appRouter;


