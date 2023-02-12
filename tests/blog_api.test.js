const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
  await Blog.deleteMany({})
  await Blog.insertMany(helper.initialBlogs)
})

describe('when there is initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  }, 100000)

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(helper.initialBlogs.length)
  }, 100000)

  test('there is a property named id', async () => {
    const response = await api.get('/api/blogs')
    const ids = response.body.map((r) => r.id)
    expect(ids[0]).toBeDefined()
  }, 100000)
})

describe('addition of a new blog', () => {
  test('a valid blog can be added', async () => {
    const newBlog = {
      _id: '3a422a851b54a676734d17f7',
      title: 'Phyton',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
      likes: 5,
      __v: 0,
    }
    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const titles = blogsAtEnd.map((r) => r.title)

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    expect(titles).toContain('Phyton')
  }, 100000)
})

describe('addition of a missing property', () => {
  test('missing property "likes" default to 0', async () => {
    const newBlog = {
      _id: '3a422a851b54a676734d17f7',
      title: 'Phyton + NodeJS',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
      __v: 0,
    }
    await api.post('/api/blogs').send(newBlog)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd[blogsAtEnd.length - 1].likes).toBeDefined()
  }, 100000)
})

describe('viewing a specific blog', () => {
  test('blog without title or url are not added', async () => {
    const newBlog = {
      _id: '3a462a854b54a676734d17f8',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
      __v: 0,
    }
    await api.post('/api/blogs').send(newBlog).expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map((r) => r.title)

    expect(titles).not.toContain(blogToDelete.title)
  })
})

describe('modifying of blog', () => {
  test('blog can be modified', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToModify = blogsAtStart[0]
    console.log(`from start: ${blogToModify.likes}`)

    blogToModify.likes = 777

    console.log(`after change: ${blogToModify.likes}`)

    blogToModify.url = 'https://pornhub.com/'
    await api
      .put(`/api/blogs/${blogToModify.id}`)
      .send(blogToModify)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()

    console.log(`at the end: ${blogsAtEnd[0].likes}`)

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
    expect(blogsAtEnd[0].likes).toBe(777)
    expect(blogsAtEnd[0].url).toContain('https://pornhub.com/')
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
