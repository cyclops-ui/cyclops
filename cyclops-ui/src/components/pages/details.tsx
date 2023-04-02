import React, {useEffect, useState} from 'react';
import {Button, Col, Collapse, Divider, Input, InputNumber, Modal, Row, Table, Tag, Typography} from 'antd';
import {Icon} from '@ant-design/compatible';
import {useNavigate} from 'react-router';
import {useParams} from "react-router-dom";
import axios from 'axios';
import {Pie} from "@ant-design/charts";
import {release} from "os";

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

interface dpl {
    app_name: String,
    namespace: String,
    kind: String,
    image_name: String,
    replicas: number,
    healthy: boolean,
    age: String,
    restarts: number,
    pods: pod[],
}

const colors = ["pink", "yellow", "orange", "cyan", "green", "blue", "purple", "magenta", "lime"];
const pieColors = ["#ffb6c1", "#ffffe0", "#ffd580", "#e0ffff", "#90ee90", "#add8e6", "#cbc3e3", "#ff80ff", "#bfff00"];

const Details = () => {
    const history = useNavigate();
    const [loading, setLoading] = useState(false);
    const [deleteName, setDeleteName] = useState("");
    const [desiredReplicas, setDesiredReplicas] = useState(0);
    const [allData, setAllData] = useState<dpl>({
        age: "",
        app_name: "",
        healthy: false,
        image_name: "",
        kind: "",
        namespace: "",
        replicas: 0,
        restarts: 0,
        pods: [],
    });
    let {namespace, deployment} = useParams();
    useEffect(() => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/namespaces/` + namespace + `/deployments/` + deployment).then(res => {
            setAllData(res.data);
        });

        setInterval(function () {
            axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/namespaces/` + namespace + `/deployments/` + deployment).then(res => {
                setAllData(res.data);
            });
        }, 2000);
    }, []);

    const data = {
        app_name: allData.app_name,
        namespace: allData.namespace,
        kind: allData.kind,
        image_name: allData.image_name,
        replicas: allData.replicas,
        healthy: allData.healthy,
        age: allData.age,
        restarts: allData.restarts,
    }

    const hashCode = (s: string) => Math.abs(s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0))

    const podData: any[] = [];
    allData.pods.map((pod: any) => {
        const labels: any[] = [];
        labels.sort((label) => {
            return hashCode(label.key)
        })
        pod.labels.map((label: any) => {
            labels.push(<Tag color={"blue"}>{label.key}:{label.value}</Tag>)
            return labels
        })

        podData.push({
            name: pod.name,
            node_name: pod.node_name,
            containers: pod.containers,
            memory: pod.memory,
            cpu: pod.cpu,
            healthy: pod.healthy,
            status: pod.status,
            age: pod.age,
            labels: <div>{labels}</div>,
            cyclops_fleet: pod.cyclops_fleet,
        })
        return podData;
    });

    const podsHealth = () => {
        var healthyPods = 0;
        allData.pods.map(p => {
            if (p.status === "Running") {
                healthyPods++;
            }
        })

        return healthyPods
    }

    const editDeployment = () => {
        console.log("editing")
    }

    const changeDeleteName = (e: any) => {
        setDeleteName(e.target.value)
    }

    const changeDesiredReplicas = (value: any) => {
        setDesiredReplicas(value)
    }

    const deleteDeployment = () => {
        axios.delete(process.env.REACT_APP_CYCLOPS_CTRL_HOST + '/deployments/' + data.app_name,
            {
                data: {
                    "name": data.app_name,
                    "kind": "deployments",
                    "namespace": data.namespace
                }
            })
            .then(function (response) {
                console.log(response)
                window.location.href = "/"
            })
            .catch(function (error) {
                console.log(error)
                window.location.href = "/"
            })
    }

    const handleCancel = () => {
        setLoading(false);
    };

    const statusTagColor = (status: string) => {
        switch (status) {
            case "Running":
                return "green"
            case "Succeeded":
                return "green"
            case "Failed":
                return "red"
            case "Pending":
                return "blue"
            default:
                return "yellow"
        }
    }

    const healthyColor = (healthy: any) => {
        if (healthy === true) {
            return "green"
        }

        return "red"
    }

    const healthyValue = (healthy: any) => {
        if (healthy === true) {
            return "Available"
        }

        return "Unavailable"
    }

    const getReleaseData = (pods: pod[]) => {
        let vals = new Map<string, number>();
        pods.forEach(pod => {
            if (!vals.has(pod.cyclops_fleet)) {
                vals.set(pod.cyclops_fleet, 1)
                return
            }

            // @ts-ignore
            vals.set(pod.cyclops_fleet, vals.get(pod.cyclops_fleet) + 1)
        })

        const releaseData: { type: string; value: number; }[] = []
        vals.forEach((value, key) => {
            releaseData.push({
                type: key,
                value: value,
            })
        })

        return releaseData
    }

    const stringToColour = function(str: string, colors: string[]) {
        return colors[hashCode(str) % colors.length]
    }

    const releaseColors = function (data: { type: string; value: number; }[]) {
        var releaseColors: string[] = [];
        data.forEach((value) => {
            releaseColors.push(stringToColour(value.type, pieColors))
        })

        return releaseColors
    }

    var releasePieConfig = {
        animationEnabled: false,
        animation: undefined,
        appendPadding: 10,
        data: getReleaseData(allData.pods),
        angleField: 'value',
        colorField: 'type',
        radius: 0.9,
        label: {
            type: 'spider',
            content: '{name}: {value} ({percentage})',
            style: {
                color: 'red',
                fontSize: 14,
                textAlign: 'center',
            },
        },
        interactions: [{type: 'element-active'}],
        animated: false,
        color: releaseColors(getReleaseData(allData.pods))
    };

    var pieConfig = {
        animationEnabled: false,
        animation: undefined,
        appendPadding: 10,
        data: [
            {
                type: 'healthy',
                value: podsHealth(),
            },
            {
                type: 'unhealthy',
                value: allData.pods.length - podsHealth(),
            },
        ],
        angleField: 'value',
        colorField: 'type',
        radius: 0.9,
        label: {
            type: 'spider',

            content: '{name}: {value} ({percentage})',
            style: {
                fontSize: 14,
                textAlign: 'center',
            },
        },
        interactions: [{type: 'element-active'}],
        animated: false,
        color:['#90EE90','#FF7F7F'],
    };

    return (
        <div>
            <Row gutter={[40, 0]}>
                <Col span={9}>
                    <Title level={1}>
                        {data.app_name}
                    </Title>
                </Col>
            </Row>
            <Row>
                <Tag color={healthyColor(allData.healthy)} style={{fontSize: '160%'}}>
                    {healthyValue(allData.healthy)}
                </Tag>
            </Row>
            <Row><Title></Title></Row>
            <Row>
                <Tag color={'orange'} style={{fontSize: '150%'}}>
                    {data.namespace}
                </Tag>
                <Tag color={'blue'} style={{fontSize: '150%'}}>
                    {data.image_name}
                </Tag>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={10}>
                    <Pie {...pieConfig} />
                </Col>
                <Col span={10}>
                    <Pie {...releasePieConfig} />
                </Col>
            </Row>
            <Divider style={{fontSize: '120%'}} orientationMargin="0" orientation={"left"}>Actions</Divider>
            <Row gutter={[40, 0]}>
                <Col>
                    <Button onClick={function () {
                        window.location.href = "/ns/" + allData.namespace + "/d/" + allData.app_name + "/edit"
                    }} block>Edit</Button>
                </Col>
                <Col>
                    <Button onClick={function () {
                        window.location.href = "/ns/" + allData.namespace + "/d/" + allData.app_name + "/edit-configurable"
                    }} block>Edit Configurable</Button>
                </Col>
                <Col>
                    <Button onClick={function () {
                        window.location.href = "/ns/" + allData.namespace + "/d/" + allData.app_name + "/history"
                    }} block>History</Button>
                </Col>
                <Col>
                    <InputNumber placeholder={allData.replicas.toString()} onChange={changeDesiredReplicas}/>
                </Col>
                <Col>
                    <Button onClick={function () {
                        axios.post(process.env.REACT_APP_CYCLOPS_CTRL_HOST + "/rescale",
                            {
                                name: allData.app_name,
                                namespace: allData.namespace,
                                desired_replicas: desiredReplicas,
                            }
                        )
                    }} loading={loading}>Rescale</Button>
                </Col>
                <Col>
                    <Button onClick={function () {
                        setLoading(true)
                    }} danger block loading={loading}>Delete</Button>
                </Col>
            </Row>
            <Divider style={{fontSize: '120%'}} orientationMargin="0" orientation={"left"}>Resources</Divider>
            <Collapse defaultActiveKey={['deployment']}>
                <Collapse.Panel header={'Deployment'} key='deployment'>
                    <Divider style={{fontSize: '120%'}} orientationMargin="0" orientation={"left"}>Details</Divider>
                    <Row>
                        <Text code style={{fontSize: '110%'}}>Age: {data.age}</Text>
                    </Row>
                    <Row>
                        <Text code style={{fontSize: '110%'}}>
                            Restarts: {data.restarts}
                        </Text>
                    </Row>
                    <Divider style={{fontSize: '120%'}} orientationMargin="0" orientation={"left"}>Pods</Divider>
                    <Col span={24} style={{overflowX: "auto"}}>
                        <Table dataSource={podData}>
                            <Table.Column
                                title='Pod name'
                                dataIndex='name'
                            />
                            <Table.Column
                                title='Node name'
                                dataIndex='node_name'
                            />
                            <Table.Column
                                title='Cyclops revision'
                                dataIndex='cyclops_fleet'
                                key='cyclops_fleet'
                                render={cyclops_fleet => (
                                    <>
                                        <Tag color={stringToColour(cyclops_fleet, colors)} key={cyclops_fleet} style={{fontSize: '120%'}}>
                                            {cyclops_fleet}
                                        </Tag>
                                    </>
                                )}
                            />
                            <Table.Column
                                title='Containers'
                                dataIndex='containers'
                                width={'20%'}
                                key='containers'
                                render={containers => (
                                    <>
                                        {
                                            containers.split(',').map((image: string) => {
                                                if (image.length === 0) {
                                                    return
                                                }
                                                return (
                                                    <Tag color={'blue'} key={image} style={{fontSize: '120%'}}>
                                                        {image}
                                                    </Tag>
                                                );
                                            })
                                        }
                                    </>
                                )}
                            /><Table.Column
                            title='Labels'
                            dataIndex='labels'
                            width={'20%'}
                            key='labels'
                            render={labels => (
                                <>
                                    {labels}
                                </>
                            )}
                        />
                            <Table.Column
                                title='Age'
                                dataIndex='age'
                                key={'age'}
                                render={age => (
                                    <Text code style={{fontSize: '110%'}}>{age}</Text>
                                )}
                            />
                            <Table.Column
                                title='Memory'
                                dataIndex='memory'
                            />
                            <Table.Column
                                title='CPU'
                                dataIndex='cpu'
                            />
                            <Table.Column
                                title='Healthy'
                                dataIndex='healthy'
                                key='healty'
                                render={healthy => (
                                    <Icon theme="twoTone" type={healthy === true ? 'check-circle' : 'close-square'}
                                          twoToneColor={healthy === true ? 'blue' : 'red'} style={{fontSize: '150%'}}/>
                                )}
                            />
                            <Table.Column
                                title='Pod Status'
                                dataIndex='status'
                                key='status'
                                render={status => (
                                    <Tag color={statusTagColor(status)}>{status}</Tag>
                                )}
                            />
                        </Table>
                    </Col>
                </Collapse.Panel>
            </Collapse>
            <Modal
                title="Delete service"
                visible={loading}
                onCancel={handleCancel}
                width={'40%'}
                footer={
                    <Button
                        danger
                        block
                        disabled={deleteName !== deployment}
                        onClick={deleteDeployment}
                    >Delete</Button>
                }
            >
                In order to delete this service, type the name of the deployment in the box below
                <Input placeholder={deployment} required onChange={changeDeleteName}/>
            </Modal>
        </div>
    );
}

export default Details;
