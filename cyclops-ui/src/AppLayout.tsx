import {Outlet} from "react-router-dom";
import SideNav from "./components/layouts/sidebar";
import React, {Suspense} from "react";
import Sider from "antd/es/layout/Sider";
import {Content, Header} from "antd/es/layout/layout";
import {Layout} from 'antd';

export default function AppLayout() {
    return (
        <Layout>
            <Sider>
                <SideNav/>
            </Sider>
            <Layout>
                <Header/>
                <Content style={{margin: '24px 16px', padding: 24, minHeight: "calc(100vh - 112px)", background: "#fff"}}>
                    <Suspense fallback={<h1 style={{textAlign: "center"}}>Loading...</h1>}>
                        <Outlet/>
                    </Suspense>
                </Content>
            </Layout>
        </Layout>
    )
}