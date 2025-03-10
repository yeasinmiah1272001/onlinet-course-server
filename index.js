const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 8000;

// middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qlvqjvw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // auth related api

    // all collection
    const usersCollection = client.db("school-managment").collection("users");
    const teacherCollection = client
      .db("school-managment")
      .collection("teachers");
    const ClassshedulesCollection = client
      .db("school-managment")
      .collection("classShedules");
    const studentCollection = client
      .db("school-managment")
      .collection("allStudents");

    // token genarate
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCES_TOKEN, {
        expiresIn: "1hr",
      });
      //   console.log("token", token);
      res.send({ token });
    });
    // user svaed database and updated user
    app.put("/users", async (req, res) => {
      const user = req.body;
      //   console.log(user);
      const query = { email: user?.email };
      //   console.log(query);
      // Check if the user exists
      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        return res.send(isExist);
      } else {
        const options = { upsert: true };
        const updateDoc = {
          $set: {
            ...user,
            timestamp: Date.now(),
          },
        };
        const result = await usersCollection.updateOne(
          query,
          updateDoc,
          options
        );
        res.send(result);
      }
    });
    // get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    // admin role chack
    app.get("/user/:email", async (req, res) => {
      const user = req.body;
      //   console.log(user);
      const email = req.params.email;
      const query = { email };
      //   console.log(query);
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // add teacher
    app.post("/add-teacher", async (req, res) => {
      const teacher = req.body;
      // console.log(teacher);
      const result = await teacherCollection.insertOne(teacher);
      res.send(result);
    });
    // acces teacher and admin
    app.get("/all-teacher", async (req, res) => {
      const result = await teacherCollection.find().toArray();
      res.send(result);
    });
    // acces admin upded teacher
    app.patch("/teacher/:id", async (req, res) => {
      const id = req.params.id;
      const teacher = req.body;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          name: teacher.name,
          admissionNumber: teacher.admissionNumber,
          subject: teacher.subject,
          date: teacher.date,
          gender: teacher.gender,
          email: teacher.email,
          joiningDate: teacher.joiningDate,
          image: teacher.image,
        },
      };
      const result = await teacherCollection.updateOne(query, updatedDoc);
      res.send(result);
    });
    // delete teacher accces admin
    app.delete("/teacher/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await teacherCollection.deleteOne(query);
      res.send(result);
    });

    // get class shedules
    app.get("/class-shudels", async (req, res) => {
      const result = await ClassshedulesCollection.find().toArray();
      res.send(result);
    });

    app.post("/all-student", async (req, res) => {
      const student = req.body;
      console.log(student);
      const result = await studentCollection.insertOne(student);
      res.send(result);
    });
    app.get("/all-student", async (req, res) => {
      const result = await studentCollection.find().toArray();
      res.send(result);
    });
    // update attendence
    app.patch("/all-student/:id", async (req, res) => {
      const id = req.params.id;
      const { attendance } = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { attendance: attendance },
      };
      const result = await studentCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello scholl-managment  Server..");
});

app.listen(port, () => {
  console.log(`school is running on port ${port}`);
});
