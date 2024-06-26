import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import useStore from '@store/store';

import LogoutIcon from '@icon/LogoutIcon';

import Cookies from 'js-cookie';

const AuthenticatedUserLogout = () => {

  const { t } = useTranslation();
  
  const userName = useStore((state) => state.userName);

  const setToastStatus = useStore((state) => state.setToastStatus);
  const setToastMessage = useStore((state) => state.setToastMessage);
  const setToastShow = useStore((state) => state.setToastShow);

  const handleSignOut = async () => {   
    // Cookies.remove('AppServiceAuthSession');
    // Cookies.remove('AppServiceAuthSession1');
    // Cookies.remove('StaticWebAppsAuthCookie');

    document.cookie = 'AppServiceAuthSession=; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = 'AppServiceAuthSession1=; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = 'StaticWebAppsAuthCookie=; expires=Thu, 01 Jan 1970 00:00:00 GMT;';

    setToastStatus('warning');
    setToastMessage('Logging Out... You will be redirected soon');
    setToastShow(true);
    
    setTimeout(() => {
      window.location.href = import.meta.env.VITE_LOGOUT_URL;
    }, 2000);
  };

  return (
    <>
      <a
        className='flex py-2 px-2 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm'
        id='api-menu'
        onClick={() => handleSignOut()}
      >
       <LogoutIcon />
        {t('logout')} ({userName})
      </a>
    </>
  );
};

export default AuthenticatedUserLogout;
