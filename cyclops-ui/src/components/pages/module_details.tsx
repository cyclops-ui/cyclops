import React, {useEffect, useState} from 'react';
import {
    Button,
    Col,
    Collapse,
    Divider,
    Form,
    Input,
    InputNumber,
    Modal,
    Row, Space,
    Switch,
    Table,
    Tag,
    Typography
} from 'antd';
import {Icon} from '@ant-design/compatible';
import {useNavigate} from 'react-router';
import {useParams} from "react-router-dom";
import axios from 'axios';
import {Pie} from "@ant-design/charts";
import {release} from "os";
import {
    CheckCircleTwoTone,
    CloseSquareTwoTone,
    LinkOutlined,
    MinusCircleOutlined,
    PlusOutlined
} from "@ant-design/icons";
import Link from "antd/lib/typography/Link";
import AceEditor from "react-ace";
import { formatDistanceToNow } from 'date-fns';

const {Title, Text} = Typography;

interface pod {
    name: string,
    node_name: string,
    containers: string,
    memory: number,
    cpu: number,
    healthy: boolean,
    status: string,
    age: string,
    cyclops_fleet: string,
}

interface module {
    name: String,
    namespace: String,
    template: String,
    version: String,
}

const colors = ["pink", "yellow", "orange", "cyan", "green", "blue", "purple", "magenta", "lime"];
const pieColors = ["#ffb6c1", "#ffffe0", "#ffd580", "#e0ffff", "#90ee90", "#add8e6", "#cbc3e3", "#ff80ff", "#bfff00"];

function formatPodAge(podAge: string): string {
    const parsedDate = new Date(podAge);
    return formatDistanceToNow(parsedDate, { addSuffix: true });
}

const ModuleDetails = () => {
    const history = useNavigate();
    const [manifestModal, setManifestModal] = useState({
        on: false,
        kind: "",
        name: "",
        namespace: "",
    })
    const [loading, setLoading] = useState(false);
    const [deleteName, setDeleteName] = useState("");
    const [resources, setResources] = useState([]);
    const [module, setModule] = useState<module>({
        name: "",
        namespace: "",
        template: "",
        version: "",
    });
    let {moduleName} = useParams();
    useEffect(() => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + moduleName).then(res => {
            setModule(res.data);
        });

        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + moduleName + `/resources`).then(res => {
            setResources(res.data);
        });

        setInterval(function () {
            axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + moduleName + `/resources`).then(res => {
                setResources(res.data);
            });
        }, 2000);
    }, []);

    const data = {
        name: module.name,
        namespace: module.namespace,
        template: module.template,
    }

    const hashCode = (s: string) => Math.abs(s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0))

    const changeDeleteName = (e: any) => {
        setDeleteName(e.target.value)
    }

    const handleCancelManifest = () => {
        setManifestModal({
            on: false,
            kind: "",
            name: "",
            namespace: "",
        })
    };

    const handleCancel = () => {
        setLoading(false);
    };

    const getManifest = () => {
        console.log(manifestModal)

        for (let i = 0; i < resources.length; i++) {
            if (resources[i]['kind'] == manifestModal.kind &&
                resources[i]['namespace'] == manifestModal.namespace &&
                resources[i]['name'] == manifestModal.name) {
                return resources[i]['manifest'];
            }
        }

        return "{}"
    }

    const deleteDeployment = () => {
        axios.delete(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/` + moduleName).then(res => {
            window.location.href = "/modules"
        });
    }

    const getResourcesToDelete = () => {
        let resourcesToDelete: JSX.Element[] = [];

        resources.forEach((resource: any) => {
            resourcesToDelete.push(
                <Row>{resource.kind}: {resource.namespace} / {resource.name}</Row>
            )
        })

        return resourcesToDelete
    }

    const resourceCollapses: {} | any = [];

    resources.forEach((resource: any) => {
        switch (resource.kind) {
            case "deployment":
                let statusIcon = resource.status ? <CheckCircleTwoTone style={{fontSize: '200%', verticalAlign: 'middle'}} twoToneColor={'blue'} /> :
                    <CloseSquareTwoTone style={{fontSize: '200%', verticalAlign: 'middle'}} twoToneColor={'red'} />
                resourceCollapses.push(
                    <Collapse.Panel header={'Deployment'} key='deployment'>
                        <Row>
                            <Col>
                                <Title level={3}>{resource.name}</Title>
                            </Col>
                            <Divider type="vertical" style={{ height: "100%" }} />
                            <Col>
                                {statusIcon}
                            </Col>
                        </Row>
                        <Row>
                            <Title level={4}>{resource.namespace}</Title>
                        </Row>
                        <Row>
                            <Col style={{ float: "right" }}>
                                <Button onClick={function () {
                                    setManifestModal({
                                        on: true,
                                        kind: resource.kind,
                                        name: resource.name,
                                        namespace: resource.namespace,
                                    })
                                }} block>View Manifest</Button>
                            </Col>
                        </Row>
                        <Divider style={{fontSize: '120%'}} orientationMargin="0" orientation={"left"}>Replicas: {resource.replicas}</Divider>
                        <Row>
                            <Col span={24} style={{overflowX: "auto"}}>
                                <Table dataSource={resource.pods}>
                                    <Table.Column
                                        title='Name'
                                        dataIndex='name'
                                        filterSearch={true}
                                        key='name'
                                    />
                                    <Table.Column
                                        title='Node'
                                        dataIndex='node'
                                    />
                                    <Table.Column
                                        title='Phase'
                                        dataIndex='podPhase'
                                    />
                                    <Table.Column
                                        title='Started'
                                        dataIndex='Started'
                                        render={(value) => (
                                            <span>{formatPodAge(value)}</span>
                                        )}
                                    />
                                    <Table.Column
                                        title='Images'
                                        dataIndex='containers'
                                        key='containers'
                                        width='15%'
                                        render={containers => (
                                            <>
                                                {
                                                    containers.map((container: any) => {
                                                        let color = container.status.running ? 'green' : 'red';

                                                        return (
                                                            <Tag color={color} key={container.image} style={{fontSize: '100%'}}>
                                                                {container.image}
                                                            </Tag>
                                                        );
                                                    })
                                                }
                                            </>
                                        )}
                                    />
                                </Table>
                            </Col>
                        </Row>
                    </Collapse.Panel>
                )
                return;
            case "service":
                resourceCollapses.push(
                    <Collapse.Panel header={'Service'} key='service'>
                        <Row>
                            <Col>
                                <Title level={3}>{resource.name}</Title>
                            </Col>
                        </Row>
                        <Row>
                            <Title level={4}>{resource.namespace}</Title>
                        </Row>
                        <Row>
                            <Col style={{ float: "right" }}>
                                <Button onClick={function () {
                                    setManifestModal({
                                        on: true,
                                        kind: resource.kind,
                                        name: resource.name,
                                        namespace: resource.namespace,
                                    })
                                }} block>View Manifest</Button>
                            </Col>
                        </Row>
                        <Row>
                            <Text>{resource.port} {'->'} {resource.targetPort}</Text>
                        </Row>
                    </Collapse.Panel>
                )
                return;
        }
    })

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={9}>
                    <Title level={1}>
                        {module.name}
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={9}>
                    <Title level={3}>
                        {module.namespace}
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={9}>
                    <Link aria-level={3} href={`/configurations/` + module.template}>
                        <LinkOutlined/>
                            {module.template}@{module.version}
                    </Link>
                </Col>
            </Row>
            <Row><Title></Title></Row>
            <Divider style={{fontSize: '120%'}} orientationMargin="0" orientation={"left"}>Actions</Divider>
            <Row gutter={[40, 0]}>
                <Col>
                    <Button onClick={function () {
                        window.location.href = "/modules/" + module.name + "/edit"
                    }} block>Edit</Button>
                </Col>
                <Col>
                    <Button onClick={function () {
                        setLoading(true)
                    }} danger block loading={loading}>Delete</Button>
                </Col>
            </Row>
            <Divider style={{fontSize: '120%'}} orientationMargin="0" orientation={"left"}>Resources</Divider>
            <Collapse defaultActiveKey={['deployment']}>
            {resourceCollapses}
            </Collapse>
            <Modal
                title="Delete module"
                visible={loading}
                onCancel={handleCancel}
                width={'40%'}
                footer={
                    <Button
                        danger
                        block
                        disabled={deleteName !== moduleName}
                        onClick={deleteDeployment}
                    >Delete</Button>
                }
            >
                <Divider style={{fontSize: '120%'}} orientationMargin="0" orientation={"left"}>Child resources</Divider>
                {getResourcesToDelete()}

                <Divider style={{fontSize: '120%'}} orientationMargin="0"/>
                In order to delete this module and related resources, type the name of the module in the box below

                <Input placeholder={moduleName} required onChange={changeDeleteName}/>
            </Modal>
            <Modal
                title="Manifest"
                visible={manifestModal.on}
                onCancel={handleCancelManifest}
                width={'40%'}
            >
                <AceEditor style={{width: "100%"}} mode={"sass"} value={getManifest()} readOnly={true} />
            </Modal>
        </div>
    );
}

export default ModuleDetails;
