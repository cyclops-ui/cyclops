import React, {useState, useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import List from "../components/pages/list";
import Form from "../components/pages/form";
import SideNav from "../components/layouts/sidebar";
import File from "../components/pages/files";
import {Layout, Select} from 'antd';
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined
} from '@ant-design/icons';
import PodsApp from "../components/pages/sshable_pods";
import Details from "../components/pages/details";
import Edit from "../components/pages/edit";
import Diff from "../components/pages/diff";
import DeploymentHistory from "../components/pages/history";
import ConfiguredForm from "../components/pages/configured_form";
import CreateForm from "../components/pages/create_form";
import Configurations from "../components/pages/configurations";
import NewAppForm from "../components/pages/new_app_by_config";
import EditConfiguration from "../components/pages/edit_configuration";
import EditAppForm from "../components/pages/edit_app_by_config";
import Modules from "../components/pages/modules";
import NewModule from "../components/pages/new_module";
import ModuleDetails from "../components/pages/module_details";
import EditModule from "../components/pages/edit_module";
import Terminal from "../components/pages/terminal";
import ModuleHistory from "../components/pages/history";
const { Header, Sider, Content} = Layout;
const ApplicationRoutes = () => {
    const [collapse, setCollapse] = useState(false);
    useEffect(() => {
        window.innerWidth <= 760 ? setCollapse(true) : setCollapse(false);
    }, []);
    const handleToggle = (event: any) => {
        event.preventDefault();
        collapse ? setCollapse(false) : setCollapse(true);
    }
    return (
        <Router>
            <Layout>
                <Sider trigger={null} collapsible collapsed={collapse}>
                    <SideNav />
                </Sider>
                <Layout>
                    <Header className="siteLayoutBackground" style={{padding: 0, background: "#001529"}}>
                        {React.createElement(collapse ? MenuUnfoldOutlined : MenuFoldOutlined, {
                            className: 'trigger',
                            onClick: handleToggle,
                            style: {color: "#fff"}
                        })}
                    </Header>
                    <Content style={{margin: '24px 16px', padding: 24, minHeight: "calc(100vh - 114px)", background: "#fff"}}>
                        <Routes>
                            <Route path="/" element={<Modules/>}/>
                            <Route path="/modules" element={<Modules/>}/>
                            {/*<Route path="/term" element={<Terminal/>}/>*/}
                            <Route path="/modules/new" element={<NewModule/>}/>
                            <Route path="/modules/:moduleName" element={<ModuleDetails/>}/>
                            <Route path="/modules/:moduleName/edit" element={<EditModule/>}/>
                            <Route path="/modules/:moduleName/rollback" element={<ModuleHistory/>}/>
                            {/*<Route path="/pods" element={<PodsApp/>}/>*/}
                            {/*<Route path="/form" element={<Form/>}/>*/}
                            {/*<Route path="/new-app" element={<NewAppForm/>}/>*/}
                            {/*<Route path="/ns/:namespace/d/:name/edit-configurable" element={<EditAppForm/>}/>*/}
                            {/*<Route path="/configurations/:name" element={<EditConfiguration/>}/>*/}
                            {/*<Route path="/create-form" element={<CreateForm/>}/>*/}
                            {/*<Route path="/configurations" element={<Configurations/>}/>*/}
                            {/*<Route path="/diff" element={<Diff/>}/>*/}
                            {/*<Route path="/ns/:namespace/d/:deployment" element={<Details/>}/>*/}
                            {/*<Route path="/ns/:namespace/d/:deployment/edit" element={<Edit/>}/>*/}
                            {/*<Route path="/ns/:namespace/d/:deployment/history" element={<DeploymentHistory/>}/>*/}
                        </Routes>
                    </Content>
                </Layout>
            </Layout>
        </Router>
    );
}
export default ApplicationRoutes;