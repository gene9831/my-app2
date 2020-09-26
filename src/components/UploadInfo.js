import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import CircularProgressWithLabel from './CircularProgressWithLabel';
import Axios from 'axios';
import { Button, Typography } from '@material-ui/core';
import DeleteOutlineIcon from '@material-ui/icons/DeleteOutline';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import Checkbox from '@material-ui/core/Checkbox';
import TaskDialog from './TaskDialog';
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import PauseCircleOutlineIcon from '@material-ui/icons/PauseCircleOutline';
import { OD_ADMIN_API } from '../App';

const useRowStyles = makeStyles({
  root: {
    '& > *': {
      borderBottom: 'unset',
    },
    '& >*:first-child': {
      width: '1rem',
      paddingRight: 'unset',
    },
  },
  detail: {
    '& > tr > td': {
      borderBottom: 'unset',
    },
  },
  green: {
    color: 'green',
  },
  red: {
    color: 'red',
  },
});

function Row(props) {
  const { row, openId, setOpenId, selected, setSelected } = props;
  const classes = useRowStyles();

  const bTokmg = (size) => {
    let kb = size / 1024;
    if (kb < 1000) {
      return kb.toFixed(1) + 'KB';
    }
    let mb = kb / 1024;
    if (mb < 1000) {
      return mb.toFixed(1) + 'MB';
    }
    return (mb / 1024).toFixed(1) + 'GB';
  };

  const sTomhd = (seconds) => {
    seconds = Math.floor(seconds);
    if (seconds < 60) {
      return seconds + 's';
    }
    let mins = Math.floor(seconds / 60);
    if (mins < 60) {
      let mo = seconds % 60;
      return mins + 'm' + (mo === 0 ? '' : mo + 's');
    }
    let hours = Math.floor(mins / 60);
    if (hours < 24) {
      let mo = mins % 60;
      return hours + 'h' + (mo === 0 ? '' : mo + 'm');
    }
    return (hours / 24).toFixed(1) + 'd';
  };

  const handleOnSelected = (e) => {
    let checked = e.target.checked;
    if (checked) {
      if (selected.indexOf(row.uid) === -1) {
        setSelected(selected.concat(row.uid));
      }
    } else {
      setSelected(selected.filter((uid) => uid !== row.uid));
    }
  };

  return (
    <React.Fragment>
      <TableRow className={classes.root} hover>
        <TableCell>
          <Checkbox
            color="primary"
            onChange={handleOnSelected}
            checked={selected.indexOf(row.uid) !== -1}
          />
        </TableCell>
        <TableCell align="left">{row.filename}</TableCell>
        <TableCell align="center">{bTokmg(row.size)}</TableCell>
        <TableCell align="center">
          {/* 速度 */}
          {row.status === 'running' ? bTokmg(row.speed) + '/s' : '---'}
        </TableCell>
        <TableCell
          align="center"
          className={clsx({
            [classes.green]: row.status === 'finished',
            [classes.red]: row.status === 'error',
          })}
        >
          {/* 进度 */}
          {(() => {
            if (row.status === 'pending') {
              return '排队中';
            } else if (row.status === 'finished') {
              return '已完成';
            } else if (row.status === 'stopped') {
              return '已暂停';
            } else if (row.status === 'error') {
              return '错误';
            } else {
              return (
                <CircularProgressWithLabel
                  value={(row.finished / row.size) * 100}
                />
              );
            }
          })()}
        </TableCell>
        <TableCell align="center">
          {/* 剩余时间 */}
          {row.status === 'running'
            ? sTomhd((row.size - row.finished) / row.speed)
            : '---'}
        </TableCell>
        <TableCell align="center">
          {/* 展开详情 */}
          <IconButton
            onClick={() => setOpenId(openId === row.uid ? '' : row.uid)}
          >
            {openId === row.uid ? (
              <KeyboardArrowUpIcon />
            ) : (
              <KeyboardArrowDownIcon />
            )}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={openId === row.uid} timeout="auto" unmountOnExit>
            <Box padding={1}>
              <Table size="small">
                <TableBody className={classes.detail}>
                  <TableRow>
                    <TableCell>文件路径：{row.file_path}</TableCell>
                    <TableCell>上传路径：{row.upload_path}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>文件大小：{bTokmg(row.size)}</TableCell>
                    <TableCell>已上传：{bTokmg(row.finished)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>创建时间：{row.created_date_time}</TableCell>
                    <TableCell>完成时间：{row.finished_date_time}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>耗时：{sTomhd(row.spend_time)}</TableCell>
                    <TableCell>
                      平均速度：{bTokmg(row.finished / row.spend_time)}/s
                    </TableCell>
                  </TableRow>
                  {row.status === 'error' ? (
                    <TableRow>
                      <TableCell className={classes.red}>
                        错误详情：{row.error}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

Row.propTypes = {
  row: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired,
    finished: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired,
    speed: PropTypes.number.isRequired,
    spend_time: PropTypes.number.isRequired,
    file_path: PropTypes.string.isRequired,
    upload_path: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    created_date_time: PropTypes.string.isRequired,
    finished_date_time: PropTypes.string.isRequired,
    error: PropTypes.string,
  }).isRequired,
  openId: PropTypes.string.isRequired,
  setOpenId: PropTypes.func.isRequired,
  selected: PropTypes.array.isRequired,
  setSelected: PropTypes.func.isRequired,
};

const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(1),
  },
  green: {
    color: '#4caf50',
    borderColor: '#81c784',
  },
}));

const compare = () => {
  return function (obj1, obj2) {
    var name1 = obj1.filename.toLowerCase();
    var name2 = obj2.filename.toLowerCase();
    if (obj1.status === 'running' && obj2.status === 'pending') return -1;
    if (obj1.status === 'pending' && obj2.status === 'running') return 1;
    if (name1 < name2) return -1;
    else if (name1 === name2) return 0;
    else return 1;
  };
};

export default function UploadInfo(props) {
  const classes = useStyles();
  const { drive, pageName } = props;
  const [openId, setOpenId] = useState('');
  const [rows, setRows] = useState([]);
  const [openUpload, setOpenUpload] = useState(false);
  const [openUploadFolder, setOpenUploadFolder] = useState(false);
  const [selected, setSelected] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleOperate = (type) => {
    if (selected.length === 0) return;
    const fetchData = async () => {
      await Axios.post(
        OD_ADMIN_API,
        {
          jsonrpc: '2.0',
          method: 'Onedrive.' + type,
          params: { uids: selected },
          id: '1',
        },
        { headers: { 'X-Password': 'secret' } }
      );
      setSelected([]);
    };
    fetchData();
  };

  const handleCheckedAll = (e) => {
    setSelectAll(e.target.checked);
    if (e.target.checked) {
      // 全选
      setSelected(rows.map((item) => item.uid));
    } else {
      setSelected([]);
    }
  };

  useEffect(() => {
    if (selected.length === 0) setSelectAll(false);
  }, [selected]);

  useEffect(() => {
    if (drive !== null) {
      const fetchData = async () => {
        let res = await Axios.post(
          OD_ADMIN_API,
          {
            jsonrpc: '2.0',
            method: 'Onedrive.uploadStatus',
            params: [drive.id, pageName],
            id: '1',
          },
          { headers: { 'X-Password': 'secret' } }
        );
        setRows(res.data.result.sort(compare()));
      };
      fetchData();
      const timer = setInterval(() => {
        fetchData();
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [drive, pageName]);

  return (
    <div>
      <Button
        variant="outlined"
        color="primary"
        className={classes.button}
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => setOpenUpload(true)}
      >
        上传
      </Button>
      <TaskDialog
        open={openUpload}
        setOpen={setOpenUpload}
        drive={drive}
        type={'file'}
        title={'上传'}
        message={'上传文件到OneDrive，文件指的是服务端文件'}
      ></TaskDialog>
      <Button
        variant="outlined"
        color="primary"
        className={classes.button}
        startIcon={<AddCircleOutlineIcon />}
        onClick={() => setOpenUploadFolder(true)}
      >
        批量上传
      </Button>
      <TaskDialog
        open={openUploadFolder}
        setOpen={setOpenUploadFolder}
        drive={drive}
        type={'folder'}
        title={'批量上传'}
        message={'批量上传文件到OneDrive，上传目录下的所有文件，不包括子目录'}
      ></TaskDialog>
      {pageName === 'stopped' ? (
        <Button
          variant="outlined"
          color="default"
          className={clsx(classes.button, classes.green)}
          startIcon={<PlayCircleOutlineIcon />}
          onClick={() => handleOperate('startUpload')}
        >
          继续
        </Button>
      ) : (
        ''
      )}
      {pageName === 'running' ? (
        <Button
          variant="outlined"
          color="default"
          className={clsx(classes.button, classes.green)}
          startIcon={<PauseCircleOutlineIcon />}
          onClick={() => handleOperate('stopUpload')}
        >
          暂停
        </Button>
      ) : (
        ''
      )}
      <Button
        variant="outlined"
        color="secondary"
        className={classes.button}
        startIcon={<DeleteOutlineIcon />}
        onClick={() => handleOperate('deleteUpload')}
      >
        删除
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Checkbox
                  checked={selectAll}
                  onChange={handleCheckedAll}
                ></Checkbox>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" gutterBottom>
                  文件名
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" gutterBottom>
                  大小
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" gutterBottom>
                  速度
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" gutterBottom>
                  进度
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Typography variant="subtitle1" gutterBottom>
                  剩余时间
                </Typography>
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <Row
                key={row.uid}
                row={row}
                openId={openId}
                setOpenId={setOpenId}
                selected={selected}
                setSelected={setSelected}
              ></Row>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

UploadInfo.propTypes = {
  drive: PropTypes.object,
  pageName: PropTypes.string.isRequired,
};
