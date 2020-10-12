import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import TextField from '@material-ui/core/TextField';
import CircularProgress from '@material-ui/core/CircularProgress';
import CheckIcon from '@material-ui/icons/Check';
import Fab from '@material-ui/core/Fab';
import clsx from 'clsx';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import rpcRequest from '../jsonrpc';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  backButton: {
    marginRight: theme.spacing(2),
  },
  instructions: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  steps: {
    textAlign: 'center',
  },
  buttonSuccess: {
    backgroundColor: theme.palette.success.main,
    '&:hover': {
      backgroundColor: theme.palette.success.main,
    },
    width: '46px',
    height: '46px',
  },
  buttonFailed: {
    backgroundColor: theme.palette.error.main,
    '&:hover': {
      backgroundColor: theme.palette.error.main,
    },
    width: '46px',
    height: '46px',
  },
}));

const steps = ['登录', '复制链接', '完成'];
const initInstructions = [
  '点击打开新窗口按钮，在新窗口中登录微软账户进行授权',
  '登录成功后会重定向，复制重定向后的链接，粘贴到输入框',
  '等待结果',
];

export default function SignIn(props) {
  const classes = useStyles();
  const { setOpenSignIn, handleSignIn } = props;
  const [signInUrl, setSignInUrl] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState(null);
  const [callbackUrl, setCallbackUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      let res = await rpcRequest('Onedrive.getSignInUrl', {
        require_auth: true,
      });
      setSignInUrl(res.data.result);
    };
    fetchData();
  }, []);

  const handleNext = () => {
    if (activeStep === 1) {
      const fetchData = async () => {
        let res = await rpcRequest('Onedrive.putCallbackUrl', {
          params: [callbackUrl],
          require_auth: true,
        });
        let res1 = res.data.result;
        setResult(res.data.result);

        if (res1) {
          setActiveStep(steps.length);
          if (res1.code === 0) {
            handleSignIn();
          }
        }
      };
      fetchData().catch((e) => {
        console.log(e.message);
        setResult({ code: -100, message: e.message });
      });
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  return (
    <div>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <div className={classes.steps}>
        {(() => {
          if (activeStep === 0)
            return (
              <Button
                component="a"
                variant="contained"
                color="secondary"
                disabled={signInUrl === null}
                href={signInUrl}
                target="_blank"
                onClick={() =>
                  setActiveStep((prevActiveStep) => prevActiveStep + 1)
                }
              >
                打开新窗口登录
              </Button>
            );
          else if (activeStep === 1)
            return (
              <TextField
                autoFocus
                id="standard-basic"
                label="粘贴链接到此处"
                variant="outlined"
                size="small"
                value={callbackUrl}
                onChange={(e) => setCallbackUrl(e.target.value)}
              />
            );
          else if (activeStep === 2)
            return (
              <div>
                <CircularProgress color="secondary" />
              </div>
            );
          return (
            <Fab
              className={clsx({
                [classes.buttonSuccess]: result.code === 0,
                [classes.buttonFailed]: result.code !== 0,
              })}
            >
              {result.code === 0 ? (
                <CheckIcon />
              ) : (
                <PriorityHighIcon style={{ color: 'white' }} />
              )}
            </Fab>
          );
        })()}
        <Typography className={classes.instructions}>
          {activeStep < steps.length
            ? initInstructions[activeStep]
            : result.message}
        </Typography>
        <div>
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              disabled={activeStep === 0}
              onClick={handleBack}
              className={classes.backButton}
            >
              返回
            </Button>
          ) : null}
          {activeStep < 2 ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={activeStep === 1 && !callbackUrl.startsWith('http')}
            >
              下一步
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              disabled={activeStep !== steps.length}
              onClick={() => setOpenSignIn(false)}
            >
              完成
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

SignIn.propTypes = {
  setOpenSignIn: PropTypes.func.isRequired,
  handleSignIn: PropTypes.func.isRequired,
};
