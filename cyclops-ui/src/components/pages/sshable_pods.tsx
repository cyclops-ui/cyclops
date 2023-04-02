import React, {useState} from 'react';
import {Col, message, Row, Typography} from 'antd';
import axios from 'axios';
import {useNavigate} from 'react-router';
import AuthButton from "./create_pod";

const {Title} = Typography;
const layout = {
    labelCol: {span: 8},
    wrapperCol: {span: 16},
};
const PodsApp = () => {
    const [loading, setLoading] = useState(false);
    const [created, setCreated] = useState(false);
    const history = useNavigate();
    const handleSubmit = (values: any) => {
        setLoading(true);
        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/dummy`,
            values
        )
            .then(res => {
                setLoading(false);
                message.success('User Added Successfully!');
                history('/list');
            })
            .catch(error => {
                setLoading(false);
                message.error(error);
            })
    }

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={23}>
                    <Title style={{textAlign: 'center'}} level={2}>
                        SSH-able pods
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={23} style={{textAlign: 'center'}}>
                    Define what sshable pods would be and why whould one use them.
                    Also how to use them.
                </Col>
            </Row>
            <AuthButton/>
        </div>
    );
}
export default PodsApp;