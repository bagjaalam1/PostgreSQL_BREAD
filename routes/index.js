const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser')
const url = require('url')
const path = require('path')
const moment = require('moment')
moment.locale('id')
const db = require('../db/db.js')

// client.connect();

// client.query('select * from public.c21', (err, data) => {
//   if (err) return console.log(err.message)
//   console.log(data.rows)
// })

/* GET home page. */

router.get('/', (req, res) => {

  const page = req.query.page || 1
  const limit = 3
  const offset = (page - 1) * limit
  const wheres = []
  const values = []
  const count = 1

  // const field = ['id', 'stringdata', 'integerdata', 'floatdata', 'datedata', 'booleandata']

  // const sortBy = field.includes(req.query.sortBy) ? req.query.sortBy : 'id';
  // const sortMode = req.query.sortMode === 'desc' ? 'desc' : 'asc';

  //pencarian
  if (req.query.id) {
    wheres.push(`id = $${count++} `)
    values.push(req.query.id)
  }

  if (req.query.stringdata) {
    wheres.push(`stringdata ilike '%' || $${count++} || '%'`)
    values.push(req.query.stringdata)
  }

  if (req.query.integerdata) {
    wheres.push(`integerdata = $${count++}`)
    values.push(req.query.integerdata)
  }

  if (req.query.floatdata) {
    wheres.push(`floatdata = $${count++}`)
    values.push(req.query.floatdata)
  }

  if (req.query.booleandata) {
    wheres.push(`booleandata = $${count++}`)
    values.push(req.query.booleandata)
  }
  if (req.query.startDate && req.query.endDate) {
    wheres.push(`datedata between $${count++} and $${count++}`)
    values.push(req.query.startDate)
    values.push(req.query.endDate)
  } else if (req.query.startDate) {
    wheres.push(`datedata between $${count++} and (select max(date) from public.breads)`)
    values.push(req.query.startDate)
  } else if (req.query.endDate) {
    wheres.push(`datedata between (select min(date) from public.breads) and $${count++}`)
    values.push(req.query.endDate)
  }

  let sql = 'SELECT COUNT(*) AS total FROM public.breads'
  if (wheres.length > 0) {
    sql += ` WHERE ${wheres.join(' and ')}`
  }

  db.query(sql, values, (err, data) => {
    if (err) return res.send(err)
    const pages = Math.ceil(data[0].total / limit)
    console.log(data)
    console.log(sql)
    console.log(values)
    console.log(req.query)
    sql = 'SELECT * FROM public.breads'
    if (wheres.length > 0) {
      sql += ` WHERE ${wheres.join(' and ')}`
    }
    sql += ` limit ${limit} offset ${offset}`

    db.query(sql, [...values, limit, offset], (err, data) => {
      if (err) return res.send(err)
      res.render('newList', { rows: data, page, pages, moment, url, query: req.query }) //kirim ke depan
    })
  })
  // const url = req.url == '/' ? '/?page=1' : req.url
  // console.log(url)

  // const page = req.query.page || 1
  // const limit = 3
  // const offset = (page - 1) * limit
  // const wheres = []
  // const values = []

  // //pencarian
  // if (req.query.id) {
  //   wheres.push(`id = ?`)
  //   values.push(req.query.id)
  // }

  // if (req.query.stringdata) {
  //   wheres.push(`stringdata like '%' || ? || '%'`)
  //   values.push(req.query.stringdata)
  // }

  // if (req.query.integerdata) {
  //   wheres.push(`integerdata = ?`)
  //   values.push(req.query.integerdata)
  // }

  // if (req.query.floatdata) {
  //   wheres.push(`floatdata = ?`)
  //   values.push(req.query.floatdata)
  // }

  // if (req.query.booleandata) {
  //   wheres.push(`booleandata = ?`)
  //   values.push(req.query.booleandata)
  // }
  // if (req.query.startDate && req.query.endDate) {
  //   wheres.push('datedata >= ? and datedata <= ?')
  //   values.push(req.query.startDate)
  //   values.push(req.query.endDate)
  // } else if (req.query.startDate) {
  //   wheres.push('datedata >= ?')
  //   values.push(req.query.startDate)
  // } else if (req.query.endDate) {
  //   wheres.push('datedata <= ?')
  //   values.push(req.query.endDate)
  // }

  // let sql = 'SELECT COUNT(*) AS total FROM public.c21'
  // if (wheres.length > 0) {
  //   sql += ` WHERE ${wheres.join(' and ')}`
  // }

  // db.query(sql, values, (err, data) => {
  //   const pages = Math.ceil(data[0].total / limit)
  //   console.log(data)
  //   console.log(sql)
  //   console.log(values)
  //   console.log(req.query)
  //   sql = 'SELECT * FROM public.c21'
  //   if (wheres.length > 0) {
  //     sql += ` WHERE ${wheres.join(' and ')}`
  //   }
  //   sql += ' LIMIT ? OFFSET ?'

  //   db.query(sql, [...values, limit, offset], (err, data) => {
  //     res.render('list', { rows: data, page, pages, moment, url, query: req.query }) //kirim ke depan
  //   })
  // })
})

router.get('/add', (req, res) => {
  res.render('add')
})

router.post('/add', (req, res) => {
  db.query('INSERT INTO public.c21 (stringdata, integerdata, floatdata, datedata, booleandata) VALUES (?,?,?,?,?)',
    [req.body.stringdata, req.body.integerdata, req.body.floatdata, req.body.datedata, req.body.booleandata],
    (err) => {
      if (err) return res.send(err)
      res.redirect('/')
    })
})

router.get('/edit/:id', (req, res) => {
  db.query('SELECT * FROM public.c21', [], (err, data) => {
    console.log(data)
    console.log(req.params.id)
    res.render('edit', { item: data[req.params.id - 1] })
  })
})

router.post('/edit/:id', (req, res) => {
  console.log(parseInt(req.body.id))
  db.query(`UPDATE public.c21 SET 
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
  db.query('DELETE FROM public.c21 WHERE id=?', [req.params.id], (err) => {
    if (err) return res.send(err)
    res.redirect('/')
  })
})

module.exports = router;


// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
