import React, { useEffect, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import MainDrawer from './MainDrawer';
import BackupIcon from '@material-ui/icons/Backup';
import CloudDoneIcon from '@material-ui/icons/CloudDone';
import CloudOffIcon from '@material-ui/icons/CloudOff';
import SettingsIcon from '@material-ui/icons/Settings';
import UploadInfo from './UploadInfo';
import Palette from './Palette';
import Settings from './Settings';
import Accounts from './Accounts';
import Exit from './Exit';
import apiRequest from '../api';
import { AccountCog, AutoRotateSyncIcon } from './Icons';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Badge from '@material-ui/core/Badge';
import { connect } from 'react-redux';
import { AUTH_STATUS, OPERATING_STATUS } from '../actions';
import HomeIcon from '@material-ui/icons/Home';
import Link from '@material-ui/core/Link';
import { styled } from '@material-ui/core';

const pageSections = [
  {
    name: 'upload',
    subHeader: '上传',
    items: [
      { name: 'running', text: '正在上传', Icon: BackupIcon },
      { name: 'stopped', text: '已停止', Icon: CloudOffIcon },
      { name: 'finished', text: '已完成', Icon: CloudDoneIcon },
    ],
  },
  {
    name: 'settings',
    subHeader: '设置',
    items: [
      { name: 'settings', text: '应用设置', Icon: SettingsIcon },
      { name: 'accounts', text: '帐号管理', Icon: AccountCog },
    ],
  },
];

let AdminManage = (props) => {
  const { authed, operationStatus, root } = props;
  const [drives, setDrives] = useState([]);

  const updateDrives = async () => {
    let res = await apiRequest('Onedrive.getDrives', { require_auth: true });
    let result = res.data.result;
    setDrives(result);
  };

  useEffect(() => {
    if (authed) {
      updateDrives();
    }
  }, [authed]);

  const pageViews = useMemo(
    () => [
      {
        name: 'upload',
        Component: UploadInfo,
        props: { drives: drives },
      },
      {
        name: 'settings',
        items: [
          {
            name: 'settings',
            Component: Settings,
          },
          {
            name: 'accounts',
            Component: Accounts,
            props: { drives: drives, updateDrives: updateDrives },
          },
        ],
      },
    ],
    [drives]
  );

  return (
    <MainDrawer
      pageProps={{
        sections: pageSections,
        views: pageViews,
        // defaultIndex: { section: 0, item: 0 },
      }}
      endComponents={[
        <React.Fragment key="syncIcon">
          {operationStatus === OPERATING_STATUS.RUNNING ? (
            <Tooltip title="操作进行中，请勿刷新页面">
              <IconButton color="inherit">
                <Badge badgeContent={1} color="secondary">
                  <AutoRotateSyncIcon />
                </Badge>
              </IconButton>
            </Tooltip>
          ) : null}
        </React.Fragment>,
        <Palette key="palette" />,
        <Tooltip key="home" title="主页">
          <IconButton
            component={styled(Link)(() => ({ color: 'inherit' }))}
            href="/"
          >
            <HomeIcon />
          </IconButton>
        </Tooltip>,
        <Exit key="exit" root={root} />,
      ]}
    ></MainDrawer>
  );
};

AdminManage.propTypes = {
  authed: PropTypes.bool,
  operationStatus: PropTypes.string,
  root: PropTypes.string,
};

const mapStateToProps = (state) => ({
  operationStatus: state.operationStatus,
  authed: state.auth.status === AUTH_STATUS.PASS,
});

AdminManage = connect(mapStateToProps)(AdminManage);

export default AdminManage;
