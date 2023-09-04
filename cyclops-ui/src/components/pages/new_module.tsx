import React, {useEffect, useState} from 'react';
import {
    Alert,
    Button,
    Col,
    Collapse,
    Divider,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Switch,
    Typography,
    Tooltip, message
} from 'antd';
import axios from 'axios';
import {useNavigate} from 'react-router';
import {MinusCircleOutlined, PlusOutlined, InfoCircleOutlined} from "@ant-design/icons";

import {useParams} from "react-router-dom";

const {Title} = Typography;
const layout = {
    labelCol: {span: 3},
    wrapperCol: {span: 13},
};

const NewModule = () => {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState({
        name: "",
        version: "",
        manifest: "",
        fields: [],
        properties: [],
    })

    const [gitTemplate, setGitTemplate] = useState({
        repo: "",
        path: "",
        commit: "",
    })

    const [error, setError] = useState({
        message: "",
        description: "",
    });

    const [successLoad, setSuccessLoad] = useState(false);

    const [loadingTemplate, setLoadingTemplate] = useState(false);

    const [activeCollapses, setActiveCollapses] = useState(new Map());
    const updateActiveCollapses = (k: string[] | string, v: any) => {
        let kk = new Array(k);
        setActiveCollapses(new Map(activeCollapses.set(kk.join(''),v)));
    }

    const history = useNavigate();

    const [form] = Form.useForm();

    useEffect(() => {
        setLoading(true);
        // axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration-details`).then(res => {
        //     setAllConfigs(res.data);
        // });

        setLoading(false);
    }, []);

    const mapsToArray = (fields: any[], values: any): any => {
        let out: any = {};
        fields.forEach(field => {
            let valuesList: any[] = [];
            switch (field.type) {
                case "string":
                    out[field.name] = values[field.name]
                    break
                case "number":
                    out[field.name] = values[field.name]
                    break
                case "boolean":
                    out[field.name] = values[field.name]
                    break
                case "object":
                    out[field.name] = mapsToArray(field.properties, values[field.name])
                    break
                case "array":
                    valuesList = values[field.name] as any[]

                    let objectArr: any[] = []
                    valuesList.forEach(valueFromList => {
                        switch (field.items.type) {
                            case "string":
                                objectArr.push(valueFromList)
                                break
                            case "object":
                                objectArr.push(mapsToArray(field.items.properties, valueFromList))
                                break
                        }
                    })
                    out[field.name] = objectArr
                    break
                case "map":
                    let object: any[] = [];

                    if (values[field.name] === undefined || values[field.name] === null) {
                        out[field.name] = {}
                        break
                    }

                    Object.keys(values[field.name]).forEach(key => {
                        object.push({
                            key: key,
                            value: values[field.name][key],
                        })
                    })

                    out[field.name] = object

                    // valuesList.forEach(valueFromList => {
                    //     // object.push({})
                    //     // object[valueFromList.key] = valueFromList.value
                    // })
                    // out[field.name] = object
                    break
            }
        })

        return out
    }

    const findMaps = (fields: any[], values: any): any => {
        let out: any = {};
        fields.forEach(field => {
            let valuesList: any[] = [];
            switch (field.type) {
                case "string":
                    out[field.name] = values[field.name]
                    break
                case "number":
                    out[field.name] = values[field.name]
                    break
                case "boolean":
                    out[field.name] = values[field.name]
                    break
                case "object":
                    out[field.name] = findMaps(field.properties, values[field.name])
                    break
                case "array":
                    valuesList = values[field.name] as any[]

                    if (!valuesList) {
                        out[field.name] = []
                        break
                    }

                    let objectArr: any[] = []
                    valuesList.forEach(valueFromList => {
                        switch (field.items.type) {
                            case "string":
                                objectArr.push(valueFromList)
                                break
                            case "object":
                                objectArr.push(findMaps(field.items.properties, valueFromList))
                                break
                        }
                    })
                    out[field.name] = objectArr
                    break
                case "map":
                    valuesList = values[field.name] as any[]

                    if (!valuesList) {
                        out[field.name] = {}
                        break
                    }

                    let object: any = {};
                    valuesList.forEach(valueFromList => {
                        object[valueFromList.key] = valueFromList.value
                    })
                    out[field.name] = object
                    break
            }
        })

        return out
    }

    const handleSubmit = (values: any) => {
        const moduleName = values["cyclops_module_name"]

        values = findMaps(config.fields, values)

        axios.post(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/modules/new`,
            {
                name: moduleName,
                values: values,
                template: {
                    name: config.name,
                    version: config.version,
                    git: {
                        repo: gitTemplate.repo,
                        path: gitTemplate.path,
                        commit: gitTemplate.commit,
                    }
                },
            })
            .then(res => {
                window.location.href = "/modules/" + moduleName
            })
            .catch(error => {
                setLoading(false);
                if (error.response === undefined) {
                    setError({
                        message: String(error),
                        description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                    })
                    setSuccessLoad(false);
                } else {
                    setError(error.response.data);
                    setSuccessLoad(false);
                }
            })
    }

    // TODO: will be used later for commit references
    // const handleChange = (value: any) => {
    //     setConfig({
    //         name: value,
    //         version: "",
    //         manifest: "",
    //         fields: [],
    //         properties: [],
    //     })
    //
    //     axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/configuration/` + value + `/versions`).then(res => {
    //         let configVersions = res.data.sort(function (a: string, b: string) {
    //             if (a === "latest") {
    //                 return -1
    //             }
    //             if (b === "latest") {
    //                 return 1
    //             }
    //             if (a < b) {
    //                 return 1;
    //             }
    //             if (a > b) {
    //                 return -1;
    //             }
    //             return 0;
    //         })
    //
    //         console.log(configVersions);
    //
    //         const versionOptions: {} | any = [];
    //         configVersions.map((v: any) => {
    //             versionOptions.push(<Select.Option key={v}>{v}</Select.Option>)
    //         })
    //     });
    // }
    //
    // const handleVersionChange = (value: any) => {
    //     axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/create-config/` + config.name + `?version=` + value).then(res => {
    //         setConfig(res.data);
    //     });
    // }

    const loadTemplate = async () => {
        setLoadingTemplate(true);

        setError({
            message: "",
            description: "",
        })

        // setGitTemplate({
        //     repo: "https://github.com/petar-cvit/starship",
        //     path: "charts/devnet",
        // })

        if (gitTemplate.repo.trim() === "") {
            setError({
                message: "Invalid repository name",
                description: "Repository name must not be empty",
            })
            setLoadingTemplate(false);
            return
        }

        let tmpConfig: any = {}

        await axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/templates/git?repo=` + gitTemplate.repo + `&path=` + gitTemplate.path + `&commit=` + gitTemplate.commit).then(templatesRes => {
            setConfig(templatesRes.data);
            tmpConfig = templatesRes.data;

            setError({
                message: "",
                description: "",
            });
            setSuccessLoad(true);
            setLoadingTemplate(false);
        }).catch(function (error) {
            setLoadingTemplate(false);
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
                setSuccessLoad(false);
            } else {
                setError(error.response.data);
                setSuccessLoad(false);
            }
        });

        axios.get(window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST + `/templates/git/initial?repo=` + gitTemplate.repo + `&path=` + gitTemplate.path + `&commit=` + gitTemplate.commit).then(res => {
            form.setFieldsValue(mapsToArray(tmpConfig.fields, res.data))

            setError({
                message: "",
                description: "",
            });
            // setSuccessLoad(true);
            // setLoadingTemplate(false);
        }).catch(function (error) {
            // setLoadingTemplate(false);
            // setSuccessLoad(false);
            if (error.response === undefined) {
                setError({
                    message: String(error),
                    description: "Check if Cyclops backend is available on: " + window.__RUNTIME_CONFIG__.REACT_APP_CYCLOPS_CTRL_HOST
                })
            } else {
                setError(error.response.data);
            }
        });
    }

    const getCollapseColor = (fieldName: string) => {
        let kk = new Array(fieldName);
        let key = kk.join('')
        if (activeCollapses.get(key) && activeCollapses.get(key) === true) {
            return "#faca93"
        } else {
            return "#fae8d4"
        }
    }

    const addonAfter = (field: any) => {
        if (field.description.length !== 0) {
            return <Tooltip title={field.description} trigger="click">
                <InfoCircleOutlined/>
            </Tooltip>
        }
    }

    const selectInputField = (field: any, formItemName: string | string[], arrayField: any) => {
        let options: {value: string, label: string}[] = []
        field.enum.forEach((option: any) => {
            options.push({
                value: option,
                label: option,
            })
        })

        return <Form.Item {...arrayField} name={formItemName} label={field.display_name}>
            <Select
                showSearch
                placeholder={field.name}
                optionFilterProp="children"
                filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={options}
            />
        </Form.Item>
    }

    const arrayInnerField = (field: any, parentFieldID: string, parent: string, level: number, arrayField: any, remove: Function) => {
        switch (field.items.type) {
            case "object":
                return <div>
                    {mapFields(field.items.properties, parentFieldID, "", level + 1, arrayField)}
                    <MinusCircleOutlined style={{ fontSize: '16px' }} onClick={() => remove(arrayField.name)} />
                </div>
            case "string":
                return <Row>
                    <Form.Item style={{paddingBottom: "0px", marginBottom: "0px"}} wrapperCol={24} {...arrayField} initialValue={field.initialValue} name={[arrayField.name]}>
                        <Input addonAfter={addonAfter(field)}/>
                    </Form.Item>
                    <MinusCircleOutlined style={{ fontSize: '16px', paddingLeft: "10px"}} onClick={() => remove(arrayField.name)} />
                </Row>
        }
    }

    function mapFields(fields: any[], parentFieldID: string | string[], parent: string, level: number, arrayField?: any, required?: string[]) {
        const formFields: {} | any = [];

        if (!fields) {
            return <></>
        }

        fields.forEach((field: any) => {
            let fieldName = field.name

            let formItemName = arrayField ? [arrayField.name, fieldName] : fieldName

            let uniqueFieldName : any = parentFieldID.length === 0 ? field.name : parentFieldID.concat(".").concat(field.name)

            let isRequired = false;

            if (required) {
                for (let r of required) {
                    if (r === field.name) {
                        isRequired = true
                        break
                    }
                }
            }

            switch (field.type) {
                case "string":
                    if (field.enum) {
                        formFields.push(selectInputField(field, formItemName, arrayField))
                        return;
                    }

                    formFields.push(
                        <Form.Item {...arrayField} name={formItemName}
                                   label={field.display_name}
                                   rules={[{required: isRequired}]}
                        >
                            <Input addonAfter={addonAfter(field)}/>
                        </Form.Item>
                    )
                    return;
                case "number":
                    formFields.push(
                        <Form.Item {...arrayField} initialValue={field.initialValue} name={formItemName} label={
                            <Tooltip title={field.description} trigger="click">
                                {field.display_name}
                            </Tooltip>
                        } rules={[{required: isRequired}]}>
                            <InputNumber style={{width: '100%'}} addonAfter={addonAfter(field)}/>
                        </Form.Item>
                    )
                    return;
                case "boolean":
                    let checked = form.getFieldValue([parentFieldID, fieldName]) === true ? "checked" : "unchecked"
                    formFields.push(
                        <Form.Item initialValue={field.initialValue} name={fieldName} id={fieldName}
                                   label={field.display_name} valuePropName={checked}>
                            <Switch />
                        </Form.Item>
                    )
                    return;
                case "object":
                    uniqueFieldName = parentFieldID.length === 0 ? field.name : parentFieldID.concat(".").concat(field.name)
                    var header = <Row>{field.name}</Row>

                    if (field.description && field.description.length !== 0) {
                        header = <Row gutter={[0, 8]}>
                            <Col span={15} style={{display: 'flex', justifyContent: 'flex-start'}}>
                                {field.name}
                            </Col>
                            <Col span={9} style={{display: 'flex', justifyContent: 'flex-end'}}>
                                <Tooltip title={field.description} trigger={["hover", "click"]}>
                                    <InfoCircleOutlined style={{right: "0px", fontSize: '20px'}}/>
                                </Tooltip>
                            </Col>
                        </Row>
                    }

                    formFields.push(
                        <Col span={level === 0 ? 16 : 24} offset={level === 0 ? 2 : 0} style={{
                            paddingBottom: "15px",
                            marginLeft: "0px",
                            marginRight: "0px",
                            paddingLeft: "0px",
                            paddingRight: "0px",
                        }}>
                            <Collapse size={"small"} onChange={function (value: string | string[]) {
                                if (value.length === 0) {
                                    updateActiveCollapses(uniqueFieldName, false)
                                } else {
                                    updateActiveCollapses(uniqueFieldName, true)
                                }
                            }}>
                                <Collapse.Panel key={fieldName} header={header} style={{backgroundColor: getCollapseColor(uniqueFieldName)}} forceRender={true}>
                                    <Form.List name={fieldName}>
                                        {(arrFields, { add, remove }) => (
                                            <>
                                                {mapFields(field.properties, [fieldName], "", level + 1, arrayField, field.required)}
                                            </>
                                        )}
                                    </Form.List>
                                </Collapse.Panel>
                            </Collapse>
                        </Col>
                    )
                    return;
                case "array":
                    uniqueFieldName = parentFieldID.length === 0 ? field.name : parentFieldID.concat(".").concat(field.name)
                    var header = <Row>{field.name}</Row>

                    if (field.description && field.description.length !== 0) {
                        header = <Row gutter={[0, 8]}>
                            <Col span={15} style={{display: 'flex', justifyContent: 'flex-start'}}>
                                {field.name}
                            </Col>
                            <Col span={9} style={{display: 'flex', justifyContent: 'flex-end'}}>
                                <Tooltip title={field.description} trigger={["hover", "click"]}>
                                    <InfoCircleOutlined style={{right: "0px", fontSize: '20px'}}/>
                                </Tooltip>
                            </Col>
                        </Row>
                    }

                    formFields.push(
                        <Col span={level === 0 ? 16 : 24} offset={level === 0 ? 2 : 0} style={{
                            paddingBottom: "15px",
                            marginLeft: "0px",
                            marginRight: "0px",
                            paddingLeft: "0px",
                            paddingRight: "0px",
                        }}>
                            <Collapse size={"small"} onChange={function (value: string | string[]) {
                                if (value.length === 0) {
                                    updateActiveCollapses(uniqueFieldName, false)
                                } else {
                                    updateActiveCollapses(uniqueFieldName, true)
                                }
                            }}>
                                <Collapse.Panel key={fieldName} header={header} style={{backgroundColor: getCollapseColor(uniqueFieldName)}} forceRender={true}>
                                    <Form.List name={formItemName}>
                                        {(arrFields, { add, remove }) => (
                                            <>
                                                {arrFields.map((arrField) => (
                                                    <Col key={arrField.key}>
                                                        {arrayInnerField(field, uniqueFieldName.concat(".").concat(arrField.name), "", level + 1, arrField, remove)}
                                                        <Divider/>
                                                    </Col>
                                                ))}

                                                <Form.Item>
                                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                                        Add
                                                    </Button>
                                                </Form.Item>
                                            </>
                                        )}
                                    </Form.List>
                                </Collapse.Panel>
                            </Collapse>
                        </Col>
                    )
                    return;
                case "map":
                    formFields.push(
                        <Form.Item name={fieldName} label={field.display_name} rules={[{required: isRequired}]}>
                            <Form.List name={formItemName} initialValue={[]}>
                                {(fields, {add, remove}) => (
                                    <>
                                        {fields.map((arrField) => (
                                            <Space key={arrField.key} style={{display: 'flex', marginBottom: 8}}
                                                   align="baseline">
                                                <Form.Item
                                                    {...arrField}
                                                    name={[arrField.name, 'key']}
                                                    rules={[{required: true, message: 'Missing key'}]}
                                                >
                                                    <Input/>
                                                </Form.Item>
                                                <Form.Item
                                                    {...arrField}
                                                    name={[arrField.name, 'value']}
                                                    rules={[{required: true, message: 'Missing value'}]}
                                                >
                                                    <Input/>
                                                </Form.Item>
                                                <MinusCircleOutlined onClick={() => remove(arrField.name)}/>
                                            </Space>
                                        ))}
                                        <Form.Item>
                                            <Button type="dashed" onClick={() => {
                                                console.log(form.getFieldsValue())
                                                console.log(formItemName, fieldName, uniqueFieldName)
                                                add()
                                            }} block icon={<PlusOutlined/>}>
                                                Add
                                            </Button>
                                        </Form.Item>
                                    </>
                                )}
                            </Form.List>
                        </Form.Item>
                    )
            }
        })

        return formFields
    }

    const onFinishFailed = () => {
        message.error('Submit failed!');
    };

    return (
        <div>
            {
                error.message.length !== 0 && <Alert
                    message={error.message}
                    description={error.description}
                    type="error"
                    closable
                    afterClose={() => {setError({
                        message: "",
                        description: "",
                    })}}
                    style={{marginBottom: '20px'}}
                />
            }
            {
                successLoad && <Alert
                    message={"Loaded template successfully"}
                    type="success"
                    closable
                    afterClose={() => {
                        setSuccessLoad(false);
                    }}
                    style={{marginBottom: '20px'}}
                />
            }
            <Row gutter={[40, 0]}>
                <Col span={23}>
                    <Title style={{textAlign: 'center'}} level={2}>
                        Define Module
                    </Title>
                </Col>
            </Row>
            <Row gutter={[40, 0]}>
                <Col span={24}>
                    <Form
                        {...layout}
                        form={form}
                        autoComplete={"off"}
                        onFinish={handleSubmit}
                        onFinishFailed={onFinishFailed}
                    >
                        <Divider orientation="left" orientationMargin="0">
                            Module template
                        </Divider>
                        <Input
                            placeholder={"Repository"}
                            style={{width: '40%'}}
                            onChange={(value: any) => {
                                setGitTemplate({
                                    repo: value.target.value,
                                    path: gitTemplate.path,
                                    commit: gitTemplate.commit,
                                })
                            }}
                        />
                        {' / '}
                        <Input
                            placeholder={"Path"}
                            style={{width: '20%'}}
                            onChange={(value: any) => {
                                setGitTemplate({
                                    repo: gitTemplate.repo,
                                    path: value.target.value,
                                    commit: gitTemplate.commit,
                                })
                            }}
                        />
                        {' @ '}
                        <Input
                            placeholder={"Branch"}
                            style={{width: '10%'}}
                            onChange={(value: any) => {
                                setGitTemplate({
                                    repo: gitTemplate.repo,
                                    path: gitTemplate.path,
                                    commit: value.target.value
                                })
                            }}
                        />
                        {'  '}
                        <Button type="primary" htmlType="button" onClick={async () => {await loadTemplate()}} loading={loadingTemplate}>
                            Load
                        </Button>
                        <Divider orientation="left" orientationMargin="0">
                            Module name
                        </Divider>
                        <Form.Item name="cyclops_module_name" id="cyclops_module_name" label="Module name"
                                   rules={[
                                       {
                                           required: true,
                                           message: 'Module name',
                                       }
                                   ]}
                        >
                            <Input/>
                        </Form.Item>
                        <Divider orientation="left" orientationMargin="0">
                            Define Module
                        </Divider>
                        {mapFields(config.fields, "", "", 0)}
                        <div style={{textAlign: "right"}}>
                            <Button type="primary" loading={loading} htmlType="submit" name="Save">
                                Save
                            </Button>{' '}
                            <Button htmlType="button" onClick={() => history('/')}>
                                Back
                            </Button>
                        </div>
                    </Form>
                </Col>
            </Row>
        </div>
    );
}
export default NewModule;
