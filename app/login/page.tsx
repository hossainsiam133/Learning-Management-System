"use client";
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import scss from "./login.module.scss";
import { Typography } from "@mui/material";
import { useRouter } from "next/navigation";

interface UserData {
  authToken: string;
  userId?: number;
  userName: string;
  isLoggedIn: boolean;
  roleName?: string;
}

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const userDataCookie = Cookies.get("userData");

    if (!userDataCookie) {
      setUserData(null);
      return;
    }

    try {
      const parsedUserData = JSON.parse(userDataCookie) as UserData;
      setUserData(parsedUserData);
    } catch {
      Cookies.remove("userData");
      setUserData(null);
    }
  }, []);

  const getRoleName = async (token: string): Promise<string | null> => {
    try {
      const response = await fetch("http://localhost:1337/api/users/me?populate=role", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const user = await response.json();
      return user?.role?.name ?? null;
    } catch (error) {
      console.error("Failed to fetch user role:", error);
      return null;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await fetch("http://localhost:1337/api/auth/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();
      // console.log("Hello"+data.user?.role?.name);
      if (response.ok) {
        const authToken = data.jwt;
        const roleName = ((await getRoleName(authToken)) ?? data.user?.role?.name ?? "Authenticated").trim();

        const userData = {
          authToken,
          userId: Number(data.user.id),
          userName: data.user.username,
          isLoggedIn: Boolean(data.user.confirmed),
          roleName: roleName || "Authenticated",
        };

        Cookies.set("userData", JSON.stringify(userData), { expires: 7 });
        setUserData(userData);
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "userData",
            newValue: JSON.stringify(userData),
          }),
        );

        if (["Admin", "Content Manager", "Instructor"].includes(roleName)) {
          router.push("/admin");
        } else if (roleName === "Authenticated") {
          router.push("/profile");
        }
      } else {
        setLoginError(data?.message?.[0]?.messages?.[0]?.message ?? "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An error occurred during login. Please try again later.");
    }
  };

  const handleSignOut = () => {
    Cookies.remove("userData");
    setUserData(null);
    router.push("/login");
  };

  return (
    <div className={scss.login}>
      <Typography>Login</Typography>
      {!userData?.isLoggedIn && (
        <form onSubmit={handleLogin}>
          <TextField
            label="Username or Email"
            variant="outlined"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Password"
            variant="outlined"
            type="password"
            value={password}
            autoComplete={"true"}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
          />
          {loginError && <p style={{ color: "red" }}>{loginError}</p>}
          <Button
            type="submit"
            variant="contained"
            color="success"
            onClick={handleLogin}
            style={{ marginRight: "0.5rem" }}
          >
            Login
          </Button>
          <Button variant="contained" color={"info"} href={"/register"}>
            Register
          </Button>
        </form>
      )}
      {userData?.isLoggedIn && (
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(46, 125, 50, 0.12)",
                color: "#1b5e20",
                fontWeight: 600,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              Logged in as: {userData.userName}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(25, 118, 210, 0.1)",
                color: "#0d47a1",
                fontWeight: 500,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              Status: {userData.isLoggedIn ? "Active Session" : "Inactive"}
            </div>
          </div>

          <Button variant="contained" onClick={handleSignOut} color={"error"}>
            Sign Out
          </Button>
        </div>
      )}
    </div>
  );
};

export default LoginPage;