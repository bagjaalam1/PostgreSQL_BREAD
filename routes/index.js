const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser')
const url = require('url')
const path = require('path')
const moment = require('moment')
moment.locale('id')
const db = require('../db/db.js')
const { Pool } = require('pg');
const { query } = require('../db/db.js');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT
});

/* GET home page. */

router.get('/', (req, res) => {

  const field = ['id', 'stringdata', 'integerdata', 'floatdata', 'datedata', 'booleandata'];

  const sortBy = field.includes(req.query.sortBy) ? req.query.sortBy : 'id';
  const sortMode = req.query.sortMode === 'desc' ? 'desc' : 'asc';

  const url = req.url == '/' ? '/?page=1&sortBy=id&sortMode=asc' : req.url;
  req.query.sortBy = sortBy;
  req.query.sortMode = sortMode;

  const page = req.query.page || 1
  const limit = 3
  const offset = (page - 1) * limit
  const wheres = []
  const values = []
  let count = 1

  //pencarian
  if (req.query.id) {
    wheres.push(`id = $${count++}`)
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
    wheres.push(`datedata between $${count++} and (select max(datedata) from public.breads)`)
    values.push(req.query.startDate)
  } else if (req.query.endDate) {
    wheres.push(`datedata between (select min(datedata) from public.breads) and $${count++}`)
    values.push(req.query.endDate)
  }

  let sql = 'SELECT COUNT(*) AS total FROM public.breads'
  if (wheres.length > 0) {
    sql += ` WHERE ${wheres.join(' and ')}`
  }

  console.log(`values: ${values}`)
  console.log(`wheres: ${wheres}`)
  console.log(`sql: ${sql}`)

  pool.query(sql, values, (err, data) => {
    console.log(data.rows)
    const pages = Math.ceil(data.rows[0].total / limit)
    sql = 'SELECT * FROM public.breads'
    if (wheres.length > 0) {
      sql += ` WHERE ${wheres.join(' and ')}`
    }
    sql += ` ORDER BY ${sortBy} ${sortMode} LIMIT ${limit} OFFSET ${offset}`

    console.log(`sql tampil data: ${sql}`)
    pool.query(sql, [...values], (err, data) => {
      if (err) return res.send(err)
      res.render('newList', { rows: data.rows, page, pages, moment, url, query: req.query }) //kirim ke depan
    })
  })
})

router.get('/add', (req, res) => {
  res.render('newAdd')
})

router.post('/add', (req, res) => {
  pool.query('insert into public.breads(stringdata, integerdata, floatdata, datedata, booleandata) values ($1, $2, $3, $4, $5)',
    [req.body.stringdata, req.body.integerdata, req.body.floatdata, req.body.datedata, req.body.booleandata],
    (err) => {
      if (err) return res.send(err)
      res.redirect('/')
    })
})

router.get('/edit/:id', (req, res) => {
  pool.query('select * from public.breads where id = $1', [req.params.id], (err, data) => {
    res.render('newEdit', { item: data.rows[0] })
  })
})

router.post('/edit/:id', (req, res) => {
  pool.query(`UPDATE public.breads SET 
    stringdata = $1,
    integerdata = $2,
    floatdata = $3,
    datedata = $4,
    booleandata = $5
    WHERE id = $6`,
    [req.body.stringdata, req.body.integerdata, req.body.floatdata, req.body.datedata, req.body.booleandata, req.body.id],
    (err) => {
      if (err) return res.send(err)
      res.redirect('/')
    })
})

router.get('/delete/:id', (req, res) => {
  pool.query('DELETE FROM public.breads WHERE id= $1', [req.params.id], (err) => {
    if (err) return res.send(err)
    res.redirect('/')
  })
})

module.exports = router;


// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });
