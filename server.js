import express from 'express';
import http from 'http';
import path from 'path';
import iocons from 'socket.io';
import formidable from 'formidable';
import mongoose from 'mongoose';
import grid from 'gridfs-stream';

const app = express();
const server = http.Server(app);
const io = iocons(server);
const gfs = { instance: null };
const EventEmitter = require('events');

class UploadRequestEmitter extends EventEmitter {
  constructor() {
    super();
    this.formUpSuccess = false;
    this.gfsWriteSuccess = false;
  }
}

/**
 * use ejs as template engine
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/server/views'));


/**
 * server static content
 */
app.use(express.static('public'));


/**
 * serve index page
 */
app.get('/', (req, res) => {
  gfs.instance.files.find({}).toArray((err, files) => {
    res.render('index', { files: files });
  })
});


app.get('/downloaderror', (req, res) => {
  res.render('error', { message: 'COULD NOT DOWNLOAD FILE' });
});

/**
 * download file
 */
app.get('/download/:id', (req, res) => {
  const fileid = req.params.id;
  gfs.instance.exist({ _id: fileid }, (err, found) => {
    if (err) {
      res.redirect('/downloaderror');
    }
    else {

      if (!found) {
        res.redirect('/downloaderror');
      }
      else {
        gfs.instance.createReadStream({ _id: fileid }).pipe(res);
      }
    }
  });
});


app.get('/removeerror', (req, res) => {
  res.render('error', { message: 'COULD NOT REMOVE FILE' });
});

app.get('/removesuccess', (req, res) => {
  res.render('error', { message: 'FILE DELETED' });
});


/**
 * delete file.
 */
app.get('/remove/:id', (req, res) => {
  const fileid = req.params.id;
  gfs.instance.exist({ _id: fileid }, (err, found) => {
    if (err) {
      res.redirect('/removeerror');
    }
    else {

      if (!found) {
        res.redirect('/removeerror');
      }
      else {
        gfs.instance.remove({ _id: fileid }, function (err) {
          if (err) {
            res.redirect('/removeerror');
          }
          else {
            res.redirect('/removesuccess');
          }
        });
      }
    }
  });
});


/**
 * upload file
 */
/*
app.post('/upload', (req, res) => {
  const reqUpload = new UploadRequestEmitter();

  reqUpload.on('removeListener', (name) => {
    console.log('REMOVED: ' + name);
  });

  reqUpload.once('errorGfsInstance', () => {
    res.render('error', { message: 'ERROR: GFS INSTANCE IS NULL' });
  });

  reqUpload.once('errorGfsWritestream', () => {
    res.render('error', { message: 'ERROR: GFS WRITESTREAM ERROR' });
  });

  reqUpload.once('errorGfsExistsCheck', (ev) => {
    res.render('error', { message: 'ERROR: GFS EXISTANCE CHECK ERROR: ' + ev.filename });
  });

  reqUpload.once('failGfsFileExists', (ev) => {
    res.render('error', { message: 'FAIL: GFS WRITESTREAM ERROR: ' + ev.filename });
  });

  reqUpload.once('successGfsWritestream', () => {
    reqUpload.gfsWriteSuccess = true;

    if(reqUpload.gfsWriteSuccess && reqUpload.formUpSuccess) {
      res.render('success', { message: 'ok' });
    }
  });

  reqUpload.once('successFormUp', () => {
    reqUpload.formUpSuccess = true;

    if(reqUpload.gfsWriteSuccess && reqUpload.formUpSuccess) {
      res.render('success', { message: 'ok' });
    }
  });

  if (gfs.instance === null) {
    reqUpload.emit('errorGfsInstance');
    return;
  }

  const form = new formidable.IncomingForm();

  form.on('end', () => {
    console.log('FORM UP END');
    reqUpload.emit('successFormUp');
  });

  // form.on('progress', (brec, bexp) => console.log('PROGRESS'));

  // We've been assuming so far that there is one file to upload per request
  // might not want this to be the case. either enforce this invariant or
  // need to handle that the case. maybe the form object provides a way to
  // check for multiple uploads.

  form.onPart = (part) => {
    if(!part.filename) {
      form.handlePart(part);
    }
    else {
      gfs.instance.exist({ filename: part.filename }, (err, found) => {
        if (err) {
          reqUpload.emit('errorGfsExistsCheck', { filename: part.filename });
        }
        else {

          if (found) {
            reqUpload.emit('failGfsFileExists', { filename: part.filename });
          }
          else {
            var writestream = gfs.instance.createWriteStream({
                filename: part.filename
            });
            writestream.on('error', function () {
              reqUpload.emit('errorGfsWritestream');
            });
            writestream.on('finish', function () {
              reqUpload.emit('successGfsWritestream');
            });
            part.pipe(writestream);
          }

        }
      })

    }
  };

  form.parse(req);
});
*/

/**
 * handle upload
 */
app.post('/upload', (req, res) => {
  if (gfs.instance === null) {
    res.send('ERROR: GFS INSTANCE IS NULL');
    return;
  }

  const form = new formidable.IncomingForm();

  form.on('end', () => {
    console.log('FORM UP END');
    res.end('ok');
  });

  // form.on('progress', (brec, bexp) => console.log('PROGRESS'));

  form.onPart = (part) => {
    if(!part.filename) {
      form.handlePart(part);
    }
    else {
      var writestream = gfs.instance.createWriteStream({
          filename: part.filename
      });
      writestream.on('error', function () {
        res.send('ERROR: GFS WRITESTREAM ERROR');
      });
      writestream.on('finish', function () {
        console.log('WRITE SUCCESS');
      });
      part.pipe(writestream);
    }
  };

  form.parse(req);
});


/**
 * handle socket connections
 */
io.on('connection', (socket) => {
  console.log('user connected');
});


/**
 * allocate mongo connection
 */
var mongoconn = mongoose.createConnection(
  'mongodb://localhost:27017/bigup'
);


/**
 * start server
 */
mongoconn.once('open', () => {
  gfs.instance = grid(mongoconn.db, mongoose.mongo);
  server.listen(8082, () => { console.log('SERVER RUNNING'); });
});
