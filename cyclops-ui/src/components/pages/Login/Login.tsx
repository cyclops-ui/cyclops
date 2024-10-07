import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, ConfigProvider, Form } from "antd";
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
import { jwtDecode } from "jwt-decode";

interface LoginResponse {
  error?: string;
  token?: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface DecodedToken {
  sub: string;
  exp: number;
  iat: number;
}

interface RoleResponse {
  roles: string[];
}

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState({
    message: "",
    description: "",
  });

  const handleSubmit = async (request: LoginRequest) => {
    try {
      const response = await axios.post<LoginResponse>("/api/login", request);
      if (response.data?.token) {
        const decodedToken = jwtDecode<DecodedToken>(response.data.token);
        Cookies.set("_isAuthenticated", "true");
        Cookies.set("token", response.data.token);
        const roleResponse = await axios.get<RoleResponse>("/api/getrole", {
          headers: {
            Authorization: `Bearer ${response.data.token}`,
          },
        });
        const userName = decodedToken.sub;
        const userRole = roleResponse.data.roles[0];
        login(userName, userRole);
        navigate("/");
      } else {
        setError({
          message: "Authentication Failed",
          description: `${response.data.error}`,
        });
        Cookies.set("_isAuthenticated", "false");
      }
    } catch (err) {
      console.error(err);
      setError({
        message: "Login Error",
        description: "An error occurred during login. Please try again.",
      });
    }
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
      <div className={styles.right_banner}>
        <div className={styles.login_container}>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#fe8801",
              },
            }}
          >
            <Form className={styles.login_form} onFinish={handleSubmit}>
              <h2 className={styles.login_header}>
                <img
                  className={styles.cyclops_login_header_login}
                  src={require("./cyclops-logo.png")}
                  alt=""
                />
              </h2>
              {error.message.length !== 0 && (
                <Alert
                  message={error.message}
                  description={error.description}
                  type="error"
                  closable
                  afterClose={() => {
                    setError({
                      message: "",
                      description: "",
                    });
                  }}
                  style={{ marginBottom: "20px" }}
                />
              )}
              <Form.Item name="username" className={styles.field_container}>
                <Input
                  size="large"
                  placeholder="Username"
                  required
                  prefix={<UserOutlined />}
                />
              </Form.Item>
              <Form.Item name="password" className={styles.field_container}>
                <Input.Password
                  size="large"
                  placeholder="Password"
                  // onChange={handlePasswordChange}
                  required
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                className={styles.submit_button}
              >
                Login
              </Button>
            </Form>
          </ConfigProvider>
        </div>
      </div>
    </div>
  );
};

export default Login;
