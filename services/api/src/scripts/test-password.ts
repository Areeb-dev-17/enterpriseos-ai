
import {
    hashPassword,
    comparePassword,
  } from "../utils/password.js";
  
  const testPassword = async () => {
    const password = "MyPassword123";
  
    const hashedPassword = await hashPassword(password);
  
    console.log("Original password:", password);
    console.log("Hashed password:", hashedPassword);
  
    const correctPassword = await comparePassword(
      password,
      hashedPassword
    );
  
    const wrongPassword = await comparePassword(
      "WrongPassword123",
      hashedPassword
    );
  
    console.log("Correct password:", correctPassword);
    console.log("Wrong password:", wrongPassword);
  };
  
  testPassword();
  