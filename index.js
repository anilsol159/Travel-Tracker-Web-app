import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import databaseData from "./database.js"


const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: databaseData.dbName,
  password: databaseData.dbPassword,
  port: 5432,
});
db.connect();

async function checkVisited(){
  const result = await db.query("SELECT country_code FROM visited_countries");
  let countries = []
  result.rows.forEach((country) => {
    countries.push(country.country_code);
    console.log(country.country_code)
  });
  console.log(result.rows)
  return countries

}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  
  const countries = await checkVisited()
  res.render("index.ejs",{countries: countries,total: countries.length});

});

app.post("/add", async (req,res)=>{
  const name = req.body['country'];
  try{
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",[name.toLowerCase()]
    );

    const data = result.rows[0];
    console.log(data);
    const country_code = data.country_code;
  
    try{
    await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)",[country_code,]);
    res.redirect("/");
    } catch(err){
      console.log(err);
      const countries = await checkVisited();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
      });
    }
  } catch(err){
    console.log(err)
    const countries = await checkVisited();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country name does not exist, try again.",
      });
  }

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
