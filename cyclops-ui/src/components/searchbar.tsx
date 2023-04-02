import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import 'antd/dist/antd.css';
import { Select } from 'antd';
import jsonp from 'fetch-jsonp';
import axios from "axios";
import { DefaultOptionType } from 'antd/lib/select';
import {useNavigate} from "react-router";

const {Option} = Select;

let timeout: NodeJS.Timeout | null;
let currentValue: any;

var options: DefaultOptionType[] | undefined;

const SearchInput = () => {
    const [allData, setAllData] = useState([]);
    useEffect(() => {
        axios.get(process.env.REACT_APP_CYCLOPS_CTRL_HOST + `/namespaces`).then(res => {
            setAllData(res.data);
        });
    }, []);

    const namespaces = [{}];
    allData.map((namespace: any) => {
        namespaces.push(
            <Option key={namespace.name}>{namespace.name}</Option>
        )
        return namespace;
    });

    console.log(namespaces);

    return (
        <Select
            id={"options"}
            mode="tags"
            defaultActiveFirstOption={false}
            placeholder={"Select namespaces"}
            style={{width: '20%'}}
            showArrow={false}
            filterOption={false}
            notFoundContent={null}
        >
            {namespaces}
        </Select>
    );
}

// class SearchInputs extends React.Component {
//     state = {
//         data: [],
//         value: undefined,
//     };
//
//
//
//     handleSearch = (value: any) => {
//         if (value) {
//             fetch(value, );
//         } else {
//             this.setState({ data: [] });
//         }
//     };
//
//     handleChange = (value: any) => {
//         this.setState({ value });
//     };
//
//     async fetch(value: any) {
//         await axios.get(`http://localhost:8080/namespaces`).then(resp => {
//             options = resp.data.namespaces.map((d: any) => <Option key={d.name}>{d.name}</Option>);
//         })
//     }
//
//     render() {
//         console.log('prije')
//         console.log(options)
//         console.log('poslje')
//
//         return (
//             <Select
//                 id={"options"}
//                 showSearch
//                 value={this.state.value}
//                 defaultActiveFirstOption={false}
//                 placeholder={"Select namespaces"}
//                 style={{width: '20%'}}
//                 showArrow={false}
//                 filterOption={false}
//                 notFoundContent={null}
//                 onClick={this.fetch}
//                 options={options}
//             >
//                 {options}
//             </Select>
//         );
//     }
// }

export default SearchInput;
