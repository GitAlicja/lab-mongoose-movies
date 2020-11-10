const express = require('express');

const Celebrity = require('../models/Celebrity.model');
const Movie = require('../models/Movie.model');

const router = express.Router();


// GET /celebrities
router.get('/', (req, res, next) => {

  Celebrity.find(null, null, { sort: { name: 1 } }).then((celebritiesFromDB) => {
    // console.log(celebritiesFromDB);
    res.render('celebrities/index', { allTheCelebrities: celebritiesFromDB });
  });
});


// GET /celebrities/new
// show form to the user
// tricky case: keep it above the code rendering /:id route! in other case browser will try to render "new" as an id and it will cause an error
router.get('/new', (req, res, next) => {

  // give the possibility to add a movie while creating new celebrity
  Movie.find().then((moviesFromDB) => {
    res.render('celebrities/new', { allTheMovies: moviesFromDB });
  });
});


// GET /celebrities/:id
router.get('/:id', (req, response, next) => {

  Celebrity.findById(req.params.id)
    .populate('movies')
    .then((celebrity) => {
      response.render('celebrities/show', celebrity);
    });

});


// pick up data from submitted form
// POST /celebrities/new
// name: req.body.name = ModelPropertyName.req.body.formInputFieldName
router.post('/new', (req, res, next) => {

  console.log(req.body);
  Celebrity.create({ name: req.body.name, occupation: req.body.occupation, catchPhrase: req.body.catchPhrase, movies: [req.body.movie] })
    // in the line above we are adding one movie ID to an array of movie's IDs to celebrity object
    // movies: [req.body.movie]
    // movies > property name (which is an array) in Celebrity model
    // movie > name of the select field in the form celebrities/new
    .then(dbCelebrity => {
      return Movie.findByIdAndUpdate(req.body.movie, { $push: { celebrities: dbCelebrity._id } })
      // in the line above we are updating movie object (adding celebrity's ID to an array of elebrities)
    })
    .then(() => {
      res.redirect('/celebrities');
    });
});



// POST /celebrities/id/delete
router.post('/:id/delete', (req, res, next) => {

  Celebrity.findByIdAndDelete(req.params.id) // builds a query to get and delete a document
    .exec() // executes the query and returns a promise for the document
    .then(dbCelebrity => { // takes deleted celebrity object

      return Promise.all(dbCelebrity.movies.map(movieId => Movie.findByIdAndUpdate(movieId, { $pull: { celebrities: dbCelebrity._id } }).exec()));
      // dbCelebrity.movies.map() > use .map() on a celebrity object, get the movies array (in that object)
      // findByIdAndUpdate() method builds another query to get and update a document (pull out the celebrity id from the movie document)

    }).then(() => {
      res.redirect('/celebrities');
    });

});



// GET celebrities/id/edit
router.get('/:id/edit', (req, res, next) => {

  Celebrity.findById(req.params.id).then((celebrity) => {
    res.render('celebrities/edit', celebrity);
  });
});


// POST celebrities/id/edit
router.post('/:id/edit', (req, res, next) => {

  Celebrity.findByIdAndUpdate(req.params.id, { name: req.body.name, occupation: req.body.occupation, catchPhrase: req.body.catchPhrase }).then(() => {
    res.redirect('/celebrities');
  });
});



module.exports = router;