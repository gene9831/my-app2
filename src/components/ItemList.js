import {
  Breadcrumbs,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Link,
  makeStyles,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@material-ui/core';
import React, { useEffect, useMemo, useState } from 'react';
import apiRequest, { FILE_URL } from '../api';
import DriveSelector from './DriveSelector';
import MyAppBar from './MyAppBar';
import Palette from './Palette';
import { bTokmg } from '../utils';
import { useHistory } from 'react-router-dom';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import PropTypes from 'prop-types';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { setGlobalSnackbarMessage } from '../actions';
import { connect } from 'react-redux';
import SettingsIcon from '@material-ui/icons/Settings';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import ComponentShell from './ComponentShell';
import { PlayBoxOutline } from './Icons';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import SubtitlesOutlinedIcon from '@material-ui/icons/SubtitlesOutlined';
import ForkMe from './ForkMe';
import DialogWithMovieInfo from './DialogWithMovieInfo';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  container: {
    flexGrow: 1,
    overflow: 'auto',
  },
  toolbar: {
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  },
  content: {
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1),
    },
  },
  table: {
    whiteSpace: 'nowrap',
    tableLayout: 'fixed',
    minWidth: '600px',
  },
  row: {
    cursor: 'default',
  },
  ellipsis: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  breadcrumbs: {
    padding: theme.spacing(2, 2, 0, 2),
  },
  breadcrumbsItem: {
    cursor: 'pointer',
  },
  breadcrumbsLink: {
    cursor: 'default',
    '&:hover': {
      textDecoration: 'none',
    },
  },
  flex: { display: 'flex' },
  itemIcon: { marginRight: theme.spacing(1) },
}));

const removeEndSlash = (s) => {
  let r = s;
  if (r.endsWith('/')) {
    r = r.slice(0, -1);
  }
  return r;
};

const descendingComparator = (a, b, orderBy) => {
  let aa = a[orderBy];
  let bb = b[orderBy];
  if (typeof aa === 'string') {
    aa = aa.toUpperCase();
    bb = bb.toUpperCase();
  }
  if (bb < aa) {
    return -1;
  }
  if (bb > aa) {
    return 1;
  }
  return 0;
};

const getComparator = (order, orderBy) => {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
};

const stableSort = (array, comparator) => {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
};

const useFileDialogStyle = makeStyles((theme) => ({
  buttons: {
    display: 'flex',
    justifyContent: 'space-around',
    paddingTop: theme.spacing(1),
  },
  textOverflow: {
    wordBreak: 'break-word',
  },
}));

let FileDialog = (props) => {
  const classes = useFileDialogStyle();
  const { open, onClose, file, setGlobalSnackbarMessage } = props;
  const file_url = useMemo(() => `${FILE_URL}/${file.id}/${file.name}`, [file]);

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose}>
      <DialogTitle>文件</DialogTitle>
      <DialogContent>
        <DialogContentText className={classes.textOverflow}>
          文件名：{file.name}
        </DialogContentText>
        <DialogContentText className={classes.textOverflow}>
          MIME 类型：{file.file && file.file.mimeType}
        </DialogContentText>
        <DialogContentText>
          大小：{`${bTokmg(file.size)} (${file.size} 字节)`}
        </DialogContentText>
        <div className={classes.buttons}>
          <CopyToClipboard text={file_url}>
            <Button
              color="primary"
              variant="outlined"
              onClick={() => setGlobalSnackbarMessage('已复制')}
            >
              复制链接
            </Button>
          </CopyToClipboard>
          <Button
            color="primary"
            variant="outlined"
            component={Link}
            href={file_url}
          >
            直接下载
          </Button>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FileDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  file: PropTypes.object.isRequired,
  setGlobalSnackbarMessage: PropTypes.func,
};

FileDialog.defaultProps = {
  file: {},
};

const mapDispatchToProps = (dispatch) => {
  return {
    setGlobalSnackbarMessage: (message) =>
      dispatch(setGlobalSnackbarMessage(message)),
  };
};

FileDialog = connect(null, mapDispatchToProps)(FileDialog);

const getItemIcon = (item) => {
  if (item.folder) return FolderOpenIcon;
  const mimeType = item.file.mimeType;
  if (mimeType.startsWith('video')) return PlayBoxOutline;
  if (mimeType.startsWith('text')) return DescriptionOutlinedIcon;
  if (
    item.name.endsWith('srt') ||
    item.name.endsWith('ssa') ||
    item.name.endsWith('ass')
  )
    return SubtitlesOutlinedIcon;
  return InsertDriveFileOutlinedIcon;
};

const AuthDialog = ({ open, onClose, state, setRows }) => {
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setPwd(e.target.value);
  };

  const handleSubmit = () => {
    const fetchData = async () => {
      let res = await apiRequest('Onedrive.getItemsByPath', {
        params: {
          drive_id: state.driveIds[state.idIndex],
          path: removeEndSlash(state.path),
          limit: 0,
          pwd: pwd,
        },
      });
      setRows(res.data.result);
      onClose();
    };
    fetchData().catch((e) => {
      if (e.response) {
        setError('密码错误');
      } else {
        setError('网络错误');
      }
    });
  };

  const handleKeyEnterDown = (e) => {
    if (e.keyCode === 13) {
      handleSubmit();
    }
  };

  return (
    <Dialog fullWidth maxWidth="xs" open={open} onClose={onClose}>
      <DialogTitle>输入密码</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          margin="dense"
          label="密码"
          value={pwd}
          onChange={handleChange}
          error={error.length > 0}
          helperText={error}
          onKeyDown={handleKeyEnterDown}
        ></TextField>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onClose}>
          取消
        </Button>
        <Button color="primary" onClick={handleSubmit}>
          确定
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AuthDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  state: PropTypes.object,
  setRows: PropTypes.func,
};

const UNAUTHORIZED = 401;

const ItemList = () => {
  const classes = useStyles();

  const [rows, setRows] = useState([]);

  const downSm = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const history = useHistory();

  const [state, setState] = useState(
    (() => {
      const query = new URLSearchParams(history.location.search);
      return {
        driveIds: [],
        idIndex: parseInt(query.get('drive') || 0),
        path: query.get('path') || '',
      };
    })()
  );

  const [order, setOrder] = useState({
    orderBy: 'name',
    order: 'asc',
  });

  const [dialogState, setDialogState] = useState({
    open: false,
    fileInfo: undefined,
  });

  const onTop = useMemo(() => Boolean(!removeEndSlash(state.path)), [
    state.path,
  ]);

  const computeRows = useMemo(() => {
    if (typeof rows === 'number') return UNAUTHORIZED;
    return rows.map((row) => ({
      ...row,
      name: row.name,
      lastModifiedDateTime: new Date(row.lastModifiedDateTime).toLocaleString(
        [],
        {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: downSm ? undefined : '2-digit',
          minute: downSm ? undefined : '2-digit',
          hour12: false,
        }
      ),
      type: (() => {
        if (row.folder) return '文件夹';
        const idx = row.name.lastIndexOf('.');
        if (idx < 0) return '.file';
        return row.name.slice(idx + 1).toUpperCase();
      })(),
      size: row.file ? row.size : 0,
    }));
  }, [downSm, rows]);

  const [openAuthDialog, setOpenAuthDialog] = useState(false);
  useEffect(() => {
    if (computeRows === UNAUTHORIZED) {
      setOpenAuthDialog(true);
    }
  }, [computeRows]);

  const tableHeads = useMemo(
    () => [
      {
        name: 'name',
        style: { width: downSm ? '40%' : '50%' },
        text: '名称',
      },
      {
        name: 'lastModifiedDateTime',
        style: { width: '20%' },
        text: '修改日期',
      },
      {
        name: 'type',
        style: { width: downSm ? '20%' : '15%' },
        text: '类型',
      },
      {
        name: 'size',
        style: { width: downSm ? '20%' : '15%' },
        text: '大小',
      },
    ],
    [downSm]
  );

  const pathList = useMemo(() => removeEndSlash(state.path).split('/'), [
    state.path,
  ]);

  useEffect(() => {
    history.listen((location) => {
      // path根据history变化而变化，是为了实现浏览器返回时数据也会刷新
      const query = new URLSearchParams(location.search);
      setState((prev) => ({
        ...prev,
        idIndex: parseInt(query.get('drive') || 0),
        path: query.get('path') || '',
      }));
    });
  }, [history]);

  useEffect(() => {
    const fetchData = async () => {
      let res = await apiRequest('Onedrive.getDriveIds');
      setState((prev) => ({
        ...prev,
        driveIds: res.data.result,
      }));
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (state.driveIds.length > state.idIndex) {
      const fetchData = async () => {
        let res = await apiRequest('Onedrive.getItemsByPath', {
          params: {
            drive_id: state.driveIds[state.idIndex],
            path: removeEndSlash(state.path),
            limit: 0,
          },
        });
        setRows(res.data.result);
      };
      fetchData();
    }
  }, [state]);

  const handleSelectDrive = (e) => {
    history.push({
      search: `?drive=${e.target.id}`,
    });
  };

  const handleClickItem = (row) => {
    if (row.folder) {
      history.push({
        search: `?drive=${state.idIndex}&path=${removeEndSlash(state.path)}/${
          row.name
        }`,
      });
    } else {
      setDialogState((prev) => ({
        ...prev,
        open: true,
        fileInfo: row,
      }));
    }
  };

  const handleClickSortCell = (name) => {
    let newOrder;
    if (order.orderBy === name) {
      newOrder = {
        ...order,
        order: order.order === 'asc' ? 'desc' : 'asc',
      };
    } else {
      newOrder = {
        ...order,
        orderBy: name,
      };
    }
    setOrder(newOrder);
  };

  const handleClickBack = () => {
    if (!onTop) {
      history.goBack();
    }
  };

  const handleClickBreadcrumbsItem = (index) => {
    history.push({
      search: `?drive=${state.idIndex}&path=${pathList
        .slice(0, index + 1)
        .join('/')}`,
    });
  };

  const [tmdbInfo, setTmdbInfo] = useState(null);
  // TODO 暂时根据path判断
  const isMovieVideo = useMemo(
    () =>
      state.path.startsWith('/Movies') &&
      dialogState.fileInfo &&
      dialogState.fileInfo.file.mimeType.startsWith('video'),
    [dialogState.fileInfo, state.path]
  );

  useEffect(() => {
    if (isMovieVideo) {
      const fetchData = async () => {
        let res = await apiRequest('TMDb.getDataByItemId', {
          params: [dialogState.fileInfo.id],
          require_auth: true,
        });
        setTmdbInfo(res.data.result);
      };
      fetchData().catch(() => {
        setTmdbInfo(null);
      });
    }
  }, [dialogState.fileInfo, isMovieVideo]);

  return (
    <div className={classes.root}>
      <ForkMe url="https://github.com/gene9831/one-app" />
      <MyAppBar
        title="文件列表"
        startIcon={onTop ? undefined : <ArrowBackIcon />}
        onClickMenu={handleClickBack}
        endComponents={[
          <Palette key="palette" />,
          <Tooltip key="supervisor" title="后台管理">
            <IconButton
              component={styled(Link)(() => ({ color: 'inherit' }))}
              href="/admin"
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>,
          <DriveSelector
            key="driveSelector"
            driveIds={state.driveIds}
            idIndex={state.idIndex}
            onClickItem={handleSelectDrive}
          />,
          <div key="marginRight" style={{ marginRight: 24 }}></div>,
        ]}
      />
      <div className={classes.container}>
        <div className={classes.toolbar}></div>
        <Container className={classes.content}>
          <Paper className={classes.paperContent}>
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              className={classes.breadcrumbs}
            >
              {pathList.map((item, index) =>
                index === pathList.length - 1 ? (
                  <Link
                    key={index}
                    variant="body2"
                    className={classes.breadcrumbsLink}
                  >
                    {item ? item : `网盘${state.idIndex + 1}`}
                  </Link>
                ) : (
                  <Typography
                    key={index}
                    variant="body2"
                    className={classes.breadcrumbsItem}
                    onClick={() => handleClickBreadcrumbsItem(index)}
                  >
                    {item ? item : `网盘${state.idIndex + 1}`}
                  </Typography>
                )
              )}
            </Breadcrumbs>
            <TableContainer>
              <Table className={classes.table}>
                <TableHead>
                  <TableRow>
                    {tableHeads.map((item) => (
                      <TableCell key={item.name} style={item.style}>
                        <TableSortLabel
                          active={order.orderBy === item.name}
                          direction={order.order}
                          onClick={() => handleClickSortCell(item.name)}
                        >
                          <Typography>{item.text}</Typography>
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stableSort(
                    computeRows === UNAUTHORIZED ? [] : computeRows,
                    getComparator(order.order, order.orderBy)
                  ).map((row, index) => (
                    <TableRow
                      key={index}
                      hover
                      onClick={() => handleClickItem(row)}
                      className={classes.row}
                    >
                      {tableHeads
                        .map((item) => item.name)
                        .map((name) =>
                          name === 'name' ? (
                            <TableCell key={name} className={classes.flex}>
                              <ComponentShell
                                Component={getItemIcon(row)}
                                Props={{ className: classes.itemIcon }}
                              />
                              <Typography className={classes.ellipsis}>
                                {row[name]}
                              </Typography>
                            </TableCell>
                          ) : (
                            <TableCell key={name}>
                              <Typography className={classes.ellipsis}>
                                {name === 'size'
                                  ? row[name] === 0
                                    ? `${row.folder.childCount} 项`
                                    : bTokmg(row[name])
                                  : row[name]}
                              </Typography>
                            </TableCell>
                          )
                        )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {computeRows === UNAUTHORIZED ? (
                <React.Fragment>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      height: '60px',
                    }}
                  >
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setOpenAuthDialog(true)}
                    >
                      输入密码
                    </Button>
                  </div>
                  <AuthDialog
                    open={openAuthDialog}
                    onClose={() => setOpenAuthDialog(false)}
                    state={state}
                    setRows={setRows}
                  />
                </React.Fragment>
              ) : null}
            </TableContainer>
          </Paper>
          {isMovieVideo && tmdbInfo ? (
            <DialogWithMovieInfo
              open={dialogState.open}
              onClose={() =>
                setDialogState((prev) => ({ ...prev, open: false }))
              }
              file={dialogState.fileInfo}
              tmdbInfo={tmdbInfo}
            />
          ) : (
            <FileDialog
              open={dialogState.open}
              onClose={() =>
                setDialogState((prev) => ({
                  ...prev,
                  open: false,
                  fileInfo: undefined,
                }))
              }
              file={dialogState.fileInfo}
            />
          )}
        </Container>
      </div>
    </div>
  );
};

export default ItemList;
