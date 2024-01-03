import React from 'react';
import {Menu, MenuProps} from 'antd';
import {
    AppstoreAddOutlined,
    HddOutlined,
} from '@ant-design/icons';
import {useLocation} from 'react-router';
import PathConstants from "../../routes/PathConstants";
import { Link } from 'react-router-dom';


const SideNav = () => {
    const location = useLocation();
    const locationKey = location.pathname.split('/', 2).join('/')

    const sidebarItems: MenuProps['items'] = [{
        label: <Link to={PathConstants.MODULES}> Modules</Link>,
        icon: <AppstoreAddOutlined/>,
        key: '/modules'
    }, {
        label: <Link to={PathConstants.NODES}> Nodes</Link>,
        icon: <HddOutlined/>,
        key: '/nodes'
    }];



    return (
        <div>
            <a href={PathConstants.MODULES}>
                <div style={{height: "32px", width: "70%", margin: "0.9rem 1rem 0.6rem 2rem", display: "inline-flex"}}>
                    <h2 style={{color: "white", marginTop: "5px"}}><b>Cyclops</b></h2>
                    <img  style={{height: "120%", marginLeft: "6px"}}
                         src={require("./KIKLOPcic.png")} alt="Cyclops" />
                </div>
            </a>
            <Menu theme="dark" mode="inline" selectedKeys={[locationKey]} items={sidebarItems}/>
        </div>
    );
}
export default SideNav;