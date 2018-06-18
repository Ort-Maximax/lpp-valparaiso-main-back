
'use strict';

const fs = require('fs');
const rimraf = require('rimraf');
const fileUpload = require('express-fileupload');
const PythonShell = require('python-shell');
const OktaJwtVerifier = require('@okta/jwt-verifier');


const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://dev-438691.oktapreview.com/oauth2/default',
});

const appRouter = (app) => {
  app.use(fileUpload());

  const updateClient = (req) => {
    if (req.app.socket) {
      req.app.socket.emit(`dataChange${req.token}`);
    }
  };

  const sendSeekable = require('send-seekable');
  app.get('/getData', (req, res) => {
    if (req.token){
      oktaJwtVerifier.verifyAccessToken(req.token)
        .then(jwt => {
          // the token is valid
          console.log(jwt.claims.sub);

          PythonShell.run('Tree.py',
            { /* args: [`datas/${jwt.claims.sub}`]*/
              args: ['datas/user1'] },
            (err, results) => {
              if (err) throw err;
              return res.status(200).send(results[0]);
            });
        })
        .catch(err => {
          console.log(err);
          return res.status(400).send('Identity check failed');
        });
    } else {
      return res.status(400).send('None shall pass');
    }

  });

  app.get('/streamFile', sendSeekable, (req, res) => {

    /* oktaJwtVerifier.verifyAccessToken(req.token)
      .then(jwt => {*/
    const pathPrefix = `${process.cwd()}/datas`;
    const path = `${pathPrefix}/${req.query.path}`;
    if (fs.existsSync(path)){
      fs.stat(path, function(error, stat) {
        if (error) { throw error; }
        console.log(path);
        const stream = fs.createReadStream(path);
        res.sendSeekable(stream, { length: stat.size});
      });
    } else {
      return res.status(400).send('File not found');
    }
  });

  app.get('/removeElement', (req, res) => {
    oktaJwtVerifier.verifyAccessToken(req.token)
      .then(jwt => {
        const pathPrefix = `${process.cwd()}/datas`;
        const path = `${pathPrefix}/${req.query.path}`;
        if (fs.existsSync(path)){
          fs.stat(path, function(error, stat) {
            if (error) { throw error; }
            if (stat.isDirectory()){
              rimraf(path, () => {
                return res.status(200).send('Folder deleted');
              });
            } else {
              fs.unlinkSync(path);
              updateClient(req);
              return res.status(200).send('File deleted');
            }
          });
        }
      })
      .catch(err => {
        console.log(err);
        return res.status(500).send(err);
      });

  });

  app.get('/downloadFile', (req, res) => {
    oktaJwtVerifier.verifyAccessToken(req.token)
      .then(jwt => {
        const pathPrefix = `${process.cwd()}/datas`;
        const path = `${pathPrefix}/${req.query.path}`;
        if (fs.existsSync(path)){
          res.download(path);
          return res.status(200);
        }
        return res.status(400).send('File not found');
      })
      .catch(err => {
        console.log(err);
        return res.status(500).send(err);
      });

  });

  app.put('/uploadFile', (req, res) => {
    if (!req.files || !req.body.path) {
      return res.status(400).send('Missing file data');
    }

    oktaJwtVerifier.verifyAccessToken(req.token)
      .then(jwt => {
        // The name of the input field (i.e. "sampleFile")
        // is used to retrieve the uploaded file
        const file = req.files.data;
        const path = req.body.path;
        // Use the mv() method to place the file somewhere on your server
        file.mv(`./datas/${path}`, function(err) {
          if (err) {
            console.log(err);
            return res.status(500).send(err);
          }
          updateClient(req);
          return res.status(200).send('File uploaded!');
        });
      })
      .catch(err => {
        console.log(err);
        return res.status(500).send(err);
      });
  });

  app.post('/createDirectory', (req, res) => {
    oktaJwtVerifier.verifyAccessToken(req.token)
      .then(jwt => {
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
      })
      .catch(err => {
        console.log(err);
        return res.status(500).send(err);
      });
  });

  app.post('/renameElement', (req, res) => {
    oktaJwtVerifier.verifyAccessToken(req.token)
      .then(jwt => {
        const elPath = `./datas/${req.body.path}`;
        if (fs.existsSync(elPath)){
          const arrPath = elPath.split('/');
          arrPath[arrPath.length - 1] = req.body.newName;
          const newPath = arrPath.join('/');

          console.log(req.body.path, newPath);

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

      })
      .catch(err => {
        return res.status(500).send(err);
      });
  });
};

module.exports = appRouter;


