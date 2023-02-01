const { response } = require('express')
const express = require('express')
const app = express()
const morgan = require('morgan')

app.use(express.json())

//app.use(morgan('tiny')) simple logging,basic
morgan.token('body', (req) => JSON.stringify(req.body))
app.use(morgan(':url :method :status :date[web] :body'))
let blogs = [
  {
    title: 'HTML is easy',
    author: 'Jack Daniels',
    url: 'www.bla-bla',
    likes: 3,
    id: 1,
  },
  {
    title: 'Lorem ipsum',
    author: 'Steve Daniels',
    url: 'www.bla-bla4654',
    likes: 8,
    id: 2,
  },
  {
    title: 'NodeJs is cool',
    author: 'Jack Sparrow',
    url: 'www.bla-bla/sdfs',
    likes: 5,
    id: 3,
  },
]

//function for unique id's
const generateId = () => {
  const maxId = blogs.length > 0 ? Math.max(...blogs.map((b) => b.id)) : 0
  return maxId + 1
}
const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}
app.use(requestLogger)

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})
app.get('/api/blogs', (request, response) => {
  response.json(blogs)
})
app.get('/api/blogs/:id', (request, response) => {
  const id = Number(request.params.id)
  const blog = blogs.find((blog) => blog.id === id)
  if (blog) {
    response.json(blog)
  } else {
    response.statusMessage = 'Current blog does not exist yet'
    response.status(404).end()
  }
})
app.post('/api/blogs', (request, response) => {
  const body = request.body
  if (!body.title) {
    return response.status(400).json({ error: 'title is missing' })
  }
  console.log(request.get('content-type'))
  console.log(request.headers)

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
    id: generateId(),
  }
  blogs = blogs.concat(blog)
  response.json(blog)
})

app.delete('/api/blogs/:id', (request, response) => {
  const id = Number(request.params.id)
  blogs = blogs.filter((blog) => blog.id !== id)

  response.status(204).end()
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)
const PORT = 3001
app.listen(PORT)
console.log(`Server running on port ${PORT}`)
