const mongoose = require('mongoose')

if (process.argv.length < 3) {
  console.log('give password as argument')
  process.exit(1)
}

const password = process.argv[2]

const url = `mongodb+srv://Bosher:${password}@cluster0.megdfbi.mongodb.net/BlogApp?retryWrites=true&w=majority`

mongoose.set('strictQuery', false)
mongoose.connect(url)

const blogSchema = new mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number,
})

const Blog = mongoose.model('Blog', blogSchema)

/* const blog = new Blog({
  title: 'Mongo is easy',
  author: 'Jack Richi',
  url: 'www.sweet_pussy',
  likes: 777,
})

blog.save().then((result) => {
  console.log('blog saved!')
  mongoose.connection.close()
}) */
Blog.find({}).then((result) => {
  result.forEach((blog) => {
    console.log(blog)
  })
  mongoose.connection.close()
})
//mongodb+srv://Bosher:3nFmlSNQl6AsLKIC@cluster0.megdfbi.mongodb.net/noteApp?retryWrites=true&w=majority
