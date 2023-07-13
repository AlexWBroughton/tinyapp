const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const users = {
  Alice: {
    id: "abc",
    email: "a@a.com",
    password: "1234",
  },
  Bob: {
    id: "def",
    email: "b@b.com",
    password: "5678",
  },
};

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
const cookieParser = require("cookie-parser");
app.use(cookieParser());

function generateRandomString() {
  const alphaString = (len, chars = "abcdefghijklmnopqrstuvwxyz0123456789") =>
    [...Array(len)]
      .map(() => chars.charAt(Math.floor(Math.random() * chars.length)))
      .join("");

  return alphaString(6);
}

const getUserByEmail = function (email) {
  for (const userID in users) {
    if (email === users[userID].email) {
      return true;
    }
  }
  return false;
};

//registration post
app.post("/register", (req, res) => {
  const newUser = req.body;
  console.log(newUser);
  const newUserId = generateRandomString().substring(1, 4);

  //error check...
  if (!newUser.email) {
    res.status(400);
    res.send("Please enter a valid email address");
    return;
  }
  if (!newUser.password) {
    res.status(400);
    res.send("Please enter a valid password");
    return;
  }
  //check the newUser email against current database
  //if there's no matching email then happy path.

  if (getUserByEmail(newUser.email)) {
    res.status(400);
    res.send("Please enter a valid email - email already registered.");
    return;
  }
  newUser["id"] = newUserId;
  users[newUserId] = newUser;
  res.cookie("user", newUserId);
  res.redirect(`/urls`);
  return;
});

//generates random short URL
app.post("/urls", (req, res) => {
  const rndAlpha = generateRandomString();
  urlDatabase[rndAlpha] = req.body.longURL;
  res.redirect(`/urls/${rndAlpha}`);
});

//deletes a url entry
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  console.log(urlDatabase);
  res.redirect(`/urls/`);
});

//posts a logout for a cookie
app.post("/logout", (req, res) => {
  res.clearCookie("user");
  res.redirect("/urls");
});

//posts a cookie for the user
app.post("/login", (req, res) => {
  const userEmail = req.body.email;

  for (const userId in users) {
    console.log(userId);
    console.log(users[userId].email);
    if (users[userId].email === userEmail) res.cookie("user", userId);
  }
  res.redirect("/urls");
});

//posts an update to the URL database from the urls_show page
app.post("/urls/:id/", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
});

//GETS

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user"]] };
  res.render("_register", templateVars);
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user"]] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  console.log(req.params.id);
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user"]],
  };
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
