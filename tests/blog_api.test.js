const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')

const Blog = require('../models/blog')
const User = require('../models/user')

const loginWithTestUser = async () => {
  const credentials = {
    username: helper.user.username,
    password: helper.user.password,
  }
  const response = await api
    .post('/api/login')
    .send(credentials)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  return response.body.token
}

beforeAll(async () => {
  await User.deleteMany({})
  const user = {
    username: helper.user.username,
    name: 'test user',
    password: helper.user.password,
  }
  await api
    .post('/api/users')
    .send(user)
    .set('Accept', 'application/json')
    .expect('Content-Type', /application\/json/)
})

beforeEach(async () => {
  await Blog.deleteMany({})
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash(helper.user.password, 10)
  let user = new User({
    username: helper.user.username,
    name: 'test user',
    passwordHash: passwordHash,
  })

  for (let blog of helper.initialBlogs) {
    let newBlog = new Blog(blog)
    newBlog.user = user.toJSON().id.toString()
    newBlog = await newBlog.save()
    user.blogs.concat(newBlog.toJSON().id.toString())
  }
  user = await user.save()
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
    const token = await loginWithTestUser()
    const newBlog = {
      title: 'Phyton',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
      likes: 5,
    }
    await api
      .post('/api/blogs')
      .send(newBlog)
      .set('Authorization', `bearer ${token}`)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    const titles = blogsAtEnd.map((r) => r.title)

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
    expect(titles).toContain('Phyton')
  }, 100000)

  test('if token is not provided blog is not added', async () => {
    const newBlog = {
      title: 'Test an app',
      author: 'Jhon Doe',
      url: 'https://fullstackopen.com/',
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  })
})

describe('addition of a missing property', () => {
  test('missing property "likes" default to 0', async () => {
    const token = await loginWithTestUser()
    const newBlog = {
      title: 'Phyton + NodeJS',
      author: 'Michael Chan',
      url: 'https://reactpatterns.com/',
    }
    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd[blogsAtEnd.length - 1].likes).toBeDefined()
  }, 100000)

  test('blog without title and url return 400 bad request', async () => {
    const token = await loginWithTestUser()
    const blogWithoutTitleAndUrl = {
      author: 'Jhon Doe',
      likes: 5,
    }
    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(blogWithoutTitleAndUrl)
      .expect(400)
    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
  }, 10000)
})

describe('deletion of a blog', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const token = await loginWithTestUser()
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1)

    const titles = blogsAtEnd.map((r) => r.title)

    expect(titles).not.toContain(blogToDelete.title)
  }, 10000)
})

describe('modifying of blog', () => {
  test('blog can be modified', async () => {
    const token = await loginWithTestUser()
    const blogsAtStart = await helper.blogsInDb()
    const blogToModify = blogsAtStart[0]

    blogToModify.likes = 777

    blogToModify.url = 'https://pornhub.com/'
    await api
      .put(`/api/blogs/${blogToModify.id}`)
      .set('Authorization', `bearer ${token}`)
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
