const express = require("express");
const app = express();
const PORT = 8080; // default port 8080


function generateRandomString() {

  const alphaString = (len, chars='abcdefghijklmnopqrstuvwxyz0123456789') => [...Array(len)].map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  
  return alphaString(6);
};


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
const cookieParser = require('cookie-parser');
app.use(cookieParser());



const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.post("/urls", (req, res) => {
  const rndAlpha = generateRandomString();
  urlDatabase[rndAlpha] = req.body.longURL;
  console.log(urlDatabase,"hello");
  res.redirect(`/urls/${rndAlpha}`); 
});


//deletes a url entry
app.post ("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  console.log(urlDatabase);
  res.redirect(`/urls/`);

});

//posts a cookie for the username
app.post("/login", (req, res) => {
  
  console.log(req.body.username);
  res.cookie('username',req.body.username);
  res.redirect("/urls");
});


//posts an update to the URL database from the urls_show page
app.post("/urls/:id/", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  console.log(urlDatabase);
});





app.get("/urls", (req, res) => {
  console.log(req.cookies);
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {username: req.cookies["username"]}
  res.render("urls_new",templateVars);
});

app.get("/urls/:id", (req, res) => {
  console.log(req.params.id);
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id],username: req.cookies["username"]};
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  console.log(urlDatabase[req.params.id]);
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});