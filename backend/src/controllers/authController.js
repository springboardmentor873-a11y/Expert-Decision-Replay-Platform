import prisma from "../db/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  console.log(name, email, password, role);

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  if (existingUser) {
    return res.status(409).json({
      message: "Email already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10); //Hashing password

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
    },
  });

  return res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "All entries are Required",
    });
  }
  const existingUser = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  if (!existingUser) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }
  const isPasswordCorrect = await bcrypt.compare(
    password,
    existingUser.password,
  );
  if (!isPasswordCorrect) {
    return res.status(401).json({
      message: "Invaild email or password",
    });
  }
  const token = jwt.sign(
    {
      userId: existingUser.id,
      role: existingUser.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    },
  );
  return res.status(200).json({
    message: "Login Successful",
    token,
  });
};

export { register, login };
