const _ = require('lodash')

// eslint-disable-next-line no-unused-vars
const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  const reducer = (sum, item) => sum + item.likes
  return blogs.length === 0 ? 0 : blogs.reduce(reducer, 0)
}
const favoriteBlog = (blogs) => {
  let obj = {
    title: '',
    author: '',
    likes: 0,
  }
  let likesCount = 0
  for (let i = 0; i < blogs.length; i++) {
    if (blogs[i].likes > likesCount) {
      let { title, author, likes } = blogs[i]
      obj.title = title
      obj.author = author
      obj.likes = likes
      likesCount = likes
    }
  }
  return obj
}
const mostBlogs = (objBlogs) => {
  let author = _.head(_(objBlogs).countBy('author').entries().maxBy(_.last))
  let blogs = _.last(_(objBlogs).countBy('author').entries().maxBy(_.last))

  return { author, blogs }
}
const mostLikes = (blogs) =>
  blogs.reduce(
    ({ sum, most }, { likes, author }) => {
      sum[author] = likes = (sum[author] || 0) + likes
      likes > most.likes ? (most = { author, likes }) : most
      return { sum, most }
    },
    { sum: {}, most: { likes: 0 } }
  ).most

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
