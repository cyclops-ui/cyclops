import React from 'react';
import {Menu, MenuProps} from 'antd';
import {
    AppstoreAddOutlined,
    HddOutlined,
} from '@ant-design/icons';
import {useNavigate}  from 'react-router';
import PathConstants from "../../routes/PathConstants";
import { Link } from 'react-router-dom';

const SideNav = () => {
    const navigate = useNavigate();
    // const handleModulesClick = () => {
    //     history('/modules');
    // }
    // const handleNodesClick = () => {
    //     history('/nodes');
    // }

    const sidebarItems: MenuProps['items'] = [{
        label: <Link to={PathConstants.MODULES}> Modules</Link>,
        icon: <AppstoreAddOutlined/>,
        key: 'modules'
    }, {
        label: <Link to={PathConstants.NODES}> Nodes</Link>,
        icon: <HddOutlined/>,
        key: 'nodes'
    }];



    return (
        <div>
            <a href={PathConstants.HOME}>
                <div style={{height: "32px", width: "70%", margin: "0.9rem 1rem 0.6rem 2rem", display: "inline-flex"}}>
                    <h2 style={{color: "white", marginTop: "5px"}}><b>Cyclops</b></h2>
                    <img  style={{height: "120%", marginLeft: "6px"}}
                         src={require("./KIKLOPcic.png")} alt="Cyclops" />
                </div>
            </a>
            <Menu theme="dark" mode="inline" defaultSelectedKeys={['modules']} items={sidebarItems}/>
            {/*<Menu theme="dark" mode="inline" defaultSelectedKeys={['1']}>*/}
            {/*    <Menu.Item key="1" onClick={handleModulesClick}>*/}
            {/*        <AppstoreAddOutlined />*/}
            {/*        <span> Modules</span>*/}
            {/*    </Menu.Item>*/}
            {/*    <Menu.Item key="2" onClick={handleNodesClick}>*/}
            {/*        <HddOutlined />*/}
            {/*        <span> Nodes</span>*/}
            {/*    </Menu.Item>*/}
            {/*</Menu>*/}
        </div>
    );
}
export default SideNav;