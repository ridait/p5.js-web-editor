import PropTypes from 'prop-types';
import React from 'react';
import { bindActionCreators } from 'redux';
import { Link, browserHistory } from 'react-router';
import { Helmet } from 'react-helmet';
import { reduxForm } from 'redux-form';
import { withTranslation } from 'react-i18next';
import * as UserActions from '../actions';
import SignupForm from '../components/SignupForm';
import apiClient from '../../../utils/apiClient';
import { validateSignup } from '../../../utils/reduxFormUtils';
import SocialAuthButton from '../components/SocialAuthButton';
import Nav from '../../../components/Nav';
import ResponsiveForm from '../components/ResponsiveForm';


class SignupView extends React.Component {
  gotoHomePage = () => {
    browserHistory.push('/');
  }

  render() {
    if (this.props.user.authenticated) {
      this.gotoHomePage();
      return null;
    }
    return (
      <div className="signup">
        <Nav layout="dashboard" />
        <main className="form-container">
          <Helmet>
            <title>{this.props.t('SignupView.Title')}</title>
          </Helmet>
          <div className="form-container__content">
            <h2 className="form-container__title">{this.props.t('SignupView.Description')}</h2>
            <SignupForm {...this.props} />
            <h2 className="form-container__divider">{this.props.t('SignupView.Or')}</h2>
            <div className="form-container__stack">
              <SocialAuthButton service={SocialAuthButton.services.github} />
              <SocialAuthButton service={SocialAuthButton.services.google} />
            </div>
            <p className="form__navigation-options">
              {this.props.t('SignupView.AlreadyHave')}
              <Link className="form__login-button" to="/login">{this.props.t('SignupView.Login')}</Link>
            </p>
          </div>
        </main>
      </div>
    );
  }
}

function asyncErrorsSelector(formName, state) {
  const form = state.form[formName];
  if (!form) {
    return {};
  }

  const fieldNames = Object.keys(form).filter(key => !key.startsWith('_'));
  return fieldNames.reduce((asyncErrors, fieldName) => {
    if (form[fieldName].asyncError) {
      return { ...asyncErrors, [fieldName]: form[fieldName].asyncError };
    }
    return asyncErrors;
  }, {});
}

function mapStateToProps(state) {
  return {
    user: state.user,
    previousPath: state.ide.previousPath,
    asyncErrors: asyncErrorsSelector('signup', state)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(UserActions, dispatch);
}

function asyncValidate(formProps, dispatch, props) {
  const errors = {};
  return Promise.resolve(true)
    .then(() => {
      const fieldToValidate = props.form._active;
      if (fieldToValidate) {
        const queryParams = {};
        queryParams[fieldToValidate] = formProps[fieldToValidate];
        queryParams.check_type = fieldToValidate;
        return apiClient.get('/signup/duplicate_check', { params: queryParams })
          .then((response) => {
            if (response.data.exists) {
              errors[fieldToValidate] = response.data.message;
            }
          });
      }
      return null;
    })
    .then(() => {
      const err = { ...errors, ...props.asyncErrors };
      if (Object.keys(err).length > 0) {
        throw err;
      }
    });
}

function onSubmitFail(errors) {
  console.log(errors);
}

SignupView.propTypes = {
  previousPath: PropTypes.string.isRequired,
  user: PropTypes.shape({
    authenticated: PropTypes.bool
  }),
  t: PropTypes.func.isRequired,
};

SignupView.defaultProps = {
  user: {
    authenticated: false
  },
};

export default withTranslation()(reduxForm({
  form: 'signup',
  fields: ['username', 'email', 'password', 'confirmPassword'],
  onSubmitFail,
  validate: validateSignup,
  asyncValidate,
  asyncBlurFields: ['username', 'email']
}, mapStateToProps, mapDispatchToProps)(SignupView));
