import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import Cookies from "js-cookie";
import {
  UserOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { Input } from "antd";
import styles from "./styles.module.css";

const Login = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const naviage = useNavigate();
  const { login } = useAuth();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await axios
      .post("/api/login", {
        username,
        password,
      })
      .then((response: any) => {
        // response
        // console.log("token", response.data.token);
        Cookies.set("_isAuthenticated", "true");
      })
      .catch((err) => console.error(err));
    //
    login();
    setUsername("");
    setPassword("");
    return naviage("/");
  };

  return (
    <div className={styles.login_page}>
      <div className={styles.left_banner}>
        <div className={styles.cyclops_image_container}>
          <img
            className={styles.cyclops_brand_image}
            src={
              "https://cyclops-ui.com/assets/images/landing_cyclops-61e2a0de0dbe8273d181c39e971fe55b.png"
            }
            alt=""
          />
        </div>
      </div>
      <div className={styles.login_container}>
        <form className={styles.login_form} onSubmit={handleSubmit}>
          <h2 className={styles.login_header}>
            <img
              className={styles.cyclops_login_header_login}
              src={
                "https://github.com/cyclops-ui/cyclops-ui.github.io/blob/main/static/img/logo_black.png?raw=true"
              }
              alt=""
            />
          </h2>
          <div className={styles.field_container}>
            <Input
              size="large"
              placeholder="Username"
              value={username}
              onChange={handleUsernameChange}
              required
              prefix={<UserOutlined />}
            />
          </div>
          <div className={styles.field_container}>
            <Input.Password
              size="large"
              placeholder="Password"
              onChange={handlePasswordChange}
              required
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </div>
          <button className={styles.submit_buttom} type="submit">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
