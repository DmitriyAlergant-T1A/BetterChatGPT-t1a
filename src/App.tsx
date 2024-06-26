import React, { useEffect, useRef } from 'react';
import useStore from '@store/store';
import i18n from './i18n';

import Chat from '@components/Chat';
import Menu from '@components/Menu';

import { ChatInterface } from '@type/chat';
import { Theme } from '@type/theme';
import Toast from '@components/Toast';

import AuthenticationUpdater from './background-components/AuthenticationUpdater';
import PageTitleUpdater from './background-components/PageTitleUpdater';
import CompanySystemPromptUpdater from './background-components/CompanySystemPromptUpdater';


// import { ClientPrincipalContextProvider } from "@aaronpowell/react-static-web-apps-auth";
import { handleNewMessageDraftBufferRetrieve } from '@utils/handleNewMessageDraftsPersistence';

function App() {
  const setChats = useStore((state) => state.setChats);
  const setTheme = useStore((state) => state.setTheme);
  const setApiKey = useStore((state) => state.setApiKey);
  const setCurrentChatIndex = useStore((state) => state.setCurrentChatIndex);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    i18n.on('languageChanged', (lng) => {
      document.documentElement.lang = lng;
    });
  }, []);

  // Synchronize New Message Draft Buffer with chat-level state
  useEffect(() => {
    handleNewMessageDraftBufferRetrieve();
  }, []);

  useEffect(() => {
    // legacy local storage
    const oldChats = localStorage.getItem('chats');
    const apiKey = localStorage.getItem('apiKey');
    const theme = localStorage.getItem('theme');

    if (apiKey) {
      // legacy local storage
      setApiKey(apiKey);
      localStorage.removeItem('apiKey');
    }

    if (theme) {
      // legacy local storage
      setTheme(theme as Theme);
      localStorage.removeItem('theme');
    }

    if (oldChats) {
      // legacy local storage
      try {
        const chats: ChatInterface[] = JSON.parse(oldChats);
        if (chats.length > 0) {
          setChats(chats);
          setCurrentChatIndex(0);
        } else {
          //initialiseNewChat();
        }
      } catch (e: unknown) {
        console.log(e);
        //initialiseNewChat();
      }
      localStorage.removeItem('chats');
    } else {
      // existing local storage
      const chats = useStore.getState().chats;
      const currentChatIndex = useStore.getState().currentChatIndex;
      if (!chats || chats.length === 0) {
        //initialiseNewChat();
      }
      if (
        chats &&
        !(currentChatIndex >= 0 && currentChatIndex < chats.length)
      ) {
        setCurrentChatIndex(0);
      }
    }
  }, []);

  const chatDownloadAreaRef = useRef<HTMLDivElement>(null);

  return (
    <div className='overflow-hidden w-full h-full relative'>
      {/* <ClientPrincipalContextProvider> */}
        <>

          {/* Background components */}
          <AuthenticationUpdater />
          <CompanySystemPromptUpdater />
          <PageTitleUpdater />

          <Menu chatDownloadAreaRef={chatDownloadAreaRef}/>
          <Chat chatDownloadAreaRef={chatDownloadAreaRef}/>
          {/* <ApiPopup /> */}
          <Toast />
        </>
      {/* </ClientPrincipalContextProvider> */}
    </div>
  );
}

export default App;
