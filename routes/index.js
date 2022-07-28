const express = require('express');
const router = express.Router();
const moment = require('moment')
moment.locale('id')

// client.connect();

// client.query('select * from public.c21', (err, data) => {
//   if (err) return console.log(err.message)
//   console.log(data.rows)
// })

/* GET home page. */

module.exports = function (db) {
  router.get('/', (req, res) => {
    const url = req.url == '/' ? '/?page=1' : req.url
    console.log(url)

    const page = req.query.page || 1
    const limit = 3
    const offset = (page - 1) * limit
    const wheres = []
    const values = []

    //pencarian
    if (req.query.id) {
      wheres.push(`id = ?`)
      values.push(req.query.id)
    }

    if (req.query.stringdata) {
      wheres.push(`stringdata like '%' || ? || '%'`)
      values.push(req.query.stringdata)
    }

    if (req.query.integerdata) {
      wheres.push(`integerdata = ?`)
      values.push(req.query.integerdata)
    }

    if (req.query.floatdata) {
      wheres.push(`floatdata = ?`)
      values.push(req.query.floatdata)
    }

    if (req.query.booleandata) {
      wheres.push(`booleandata = ?`)
      values.push(req.query.booleandata)
    }
    if (req.query.startDate && req.query.endDate) {
      wheres.push('datedata >= ? and datedata <= ?')
      values.push(req.query.startDate)
      values.push(req.query.endDate)
    } else if (req.query.startDate) {
      wheres.push('datedata >= ?')
      values.push(req.query.startDate)
    } else if (req.query.endDate) {
      wheres.push('datedata <= ?')
      values.push(req.query.endDate)
    }

    let sql = 'SELECT COUNT(*) AS total FROM breads'
    if (wheres.length > 0) {
      sql += ` WHERE ${wheres.join(' and ')}`
    }

    db.all(sql, values, (err, data) => {
      const pages = Math.ceil(data[0].total / limit)
      console.log(data)
      console.log(sql)
      console.log(values)
      console.log(req.query)
      sql = 'SELECT * FROM breads'
      if (wheres.length > 0) {
        sql += ` WHERE ${wheres.join(' and ')}`
      }
      sql += ' LIMIT ? OFFSET ?'

      db.all(sql, [...values, limit, offset], (err, data) => {
        res.render('list', { rows: data, page, pages, moment, url, query: req.query }) //kirim ke depan
      })
    })
  })

  router.get('/add', (req, res) => {
    res.render('add')
  })

  router.post('/add', (req, res) => {
    db.run('INSERT INTO breads (stringdata, integerdata, floatdata, datedata, booleandata) VALUES (?,?,?,?,?)',
      [req.body.stringdata, req.body.integerdata, req.body.floatdata, req.body.datedata, req.body.booleandata],
      (err) => {
        if (err) return res.send(err)
        res.redirect('/')
      })
  })

  router.get('/edit/:id', (req, res) => {
    db.all('SELECT * FROM breads', [], (err, data) => {
      console.log(data)
      console.log(req.params.id)
      res.render('edit', { item: data[req.params.id - 1] })
    })
  })

  router.post('/edit/:id', (req, res) => {
    console.log(parseInt(req.body.id))
    db.run(`UPDATE breads SET 
    stringdata = ?,
    integerdata = ?,
    floatdata = ?,
    datedata = ?,
    booleandata = ?
    WHERE id = ?`,
      [req.body.stringdata, req.body.integerdata, req.body.floatdata, req.body.datedata, req.body.booleandata, req.body.id],
      (err) => {
        console.log(req.body.stringdata)
        console.log(req.body.integerdata)
        console.log(req.body.floatdata)
        console.log(req.body.datedata)
        console.log(req.body.booleandata)
        console.log(req.body.id)
        if (err) return res.send(err)
        res.redirect('/')
      })
  })

  router.get('/delete/:id', (req, res) => {
    db.run('DELETE FROM breads WHERE id=?', [req.params.id], (err) => {
      if (err) return res.send(err)
      res.redirect('/')
    })
  })

  return router;
}

// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
