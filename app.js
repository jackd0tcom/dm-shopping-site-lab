import express from "express";
import nunjucks from "nunjucks";
import morgan from "morgan";
import session from "express-session";
import users from "./users.json" assert { type: "json" };
import stuffedAnimalData from "./stuffed-animal-data.json" assert { type: "json" };

const app = express();
const port = "8000";

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(
  session({ secret: "ssshhhhh", saveUninitialized: true, resave: false })
);

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

function getAnimalDetails(animalId) {
  return stuffedAnimalData[animalId];
}

app.get("/", (req, res) => {
  res.render("index.html");
});

app.get("/all-animals", (req, res) => {
  res.render("all-animals.html.njk", {
    animals: Object.values(stuffedAnimalData),
  });
});

app.get("/animal-details/:animalId", (req, res) => {
  const animalDetails = getAnimalDetails(req.params.animalId);
  res.render("animal-details.html.njk", { animal: animalDetails });
});

app.get("/add-to-cart/:animalId", (req, res) => {
  const sess = req.session;
  const animalId = req.params.animalId;
  if (!sess.cart) {
    sess.cart = {};
  }

  if (!(animalId in sess.cart)) {
    sess.cart[animalId] = 0;
  }
  sess.cart[animalId] += 1;

  res.redirect("/cart");
});

app.get("/cart", (req, res) => {
  const { username } = req.session;
  const cart = req.session.cart;
  const cartArr = [];
  let total = 0;
  for (let item in cart) {
    const quantity = cart[item];
    const animal = getAnimalDetails(item);
    const totalCost = animal.price * quantity;
    total += totalCost;
    animal.quantity = quantity;
    animal.totalCost = totalCost;
    cartArr.push(animal);
  }

  res.render("cart.html.njk", {
    total: total,
    cartArr: cartArr,
    username: username,
  });
});

app.get("/add/:animalName", (req, res) => {
  const animalName = req.params;
  const quantity = req.session;
  for (let item in req.session.cart) {
    console.log(item);
    // if(item === animalName){

    // }
  }
  // console.log(quantity);
});

app.get("/checkout", (req, res) => {
  // Empty the cart.
  req.session.cart = {};
  res.redirect("/all-animals");
});

app.get("/login", (req, res) => {
  res.render("login.html.njk");
});

app.post("/process-login", (req, res) => {
  const { username } = req.body;
  const { password } = req.body;
  for (let account in users) {
    if (users[account].username === username) {
      if (users[account].password === password) {
        req.session.username = username;
        res.redirect("/all-animals");
        return;
      }
    }
  }
  res.render("login.html.njk", {
    message:
      "Username/ Password combo did not match any in our records. Please try again.",
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}...`);
});
