//useSubmit.ts

import useStore from '@store/store';
import { ChatInterface, MessageInterface } from '@type/chat';
import { prepareApiHeaders, getChatCompletion, getChatCompletionStream, handleStream } from '@src/api-helpers/api';
import { limitMessageTokens, updateTotalTokenUsed } from '@utils/messageUtils';
import { supportedModels, _defaultChatConfig } from '@constants/chat';

export interface OpenAICompletionsConfig {
  model: string;
  max_tokens: number,
  temperature: number;
  presence_penalty: number;
  top_p: number;
  frequency_penalty: number;
}

const _contentGeneratingPlaceholder = '_AI model response requested..._';

const useSubmit = () => 
{
  const setError          = useStore((state) => state.setError);
  const setGenerating     = useStore((state) => state.setGenerating);

  const handleSubmit = async () => {

    console.debug('Chat completion request initiated...');

    //This is an util function not a renderable component, so direct State access is used

    const countTotalTokens  = useStore.getState().countTotalTokens;
    const generating        = useStore.getState().generating;
    const currentChatIndex  = useStore.getState().currentChatIndex;
    const currChats         = useStore.getState().chats;
    const setChats          = useStore.getState().setChats;

    if (generating || !currChats) return;

    let _currentChatIndex: number;
    let _currentMessageIndex: number;

    const addAssistantContent = (content: string) => 
    {
      const updatedChats: ChatInterface[] = JSON.parse(
        JSON.stringify(useStore.getState().chats)
      );
      const updatedMessages = updatedChats[_currentChatIndex].messages;

      //Removing "Generating..." placeholder
      if (updatedMessages[_currentMessageIndex].content == _contentGeneratingPlaceholder)
        updatedMessages[_currentMessageIndex].content = ''; 

      updatedMessages[_currentMessageIndex].content += content;
      setChats(updatedChats);
    }

    try {

      if (currChats[currentChatIndex].messages.length === 0)
      throw new Error('No messages submitted!');

      setGenerating(true);

      /* Add Assistant's message placeholder (for future received content)*/

      const updatedChats: ChatInterface[] = JSON.parse(JSON.stringify(useStore.getState().chats));

      updatedChats[currentChatIndex].messages.push({
        role: 'assistant',
        content: _contentGeneratingPlaceholder,
        model: updatedChats[currentChatIndex].config.model
      });

      _currentChatIndex = currentChatIndex;
      _currentMessageIndex = updatedChats[currentChatIndex].messages.length - 1;

      setChats(updatedChats);
      /************/

      /* Select context messages for submission */
      const [inputMessagesLimited, systemTokenCount, chatTokenCount, lastMessageTokens] = limitMessageTokens(
        currChats[currentChatIndex].messages,
        currChats[currentChatIndex].config.maxPromptTokens,
        currChats[currentChatIndex].config.model
      );

      // TBD refactor... 
      // The limitMessageTokens was already called once during validation phase

      /************/


      let stream;
      
      const completionsConfig: OpenAICompletionsConfig = {
        model: supportedModels[currChats[currentChatIndex].config.model].apiAliasCurrent,
        max_tokens: currChats[currentChatIndex].config.maxGenerationTokens,
        temperature: currChats[currentChatIndex].config.temperature,
        presence_penalty: currChats[currentChatIndex].config.presence_penalty,
        top_p: currChats[currentChatIndex].config.top_p,
        frequency_penalty: currChats[currentChatIndex].config.frequency_penalty
      };

      const headers = await prepareApiHeaders(currChats[currentChatIndex].config.model, inputMessagesLimited, 'Chat Submission');    
      
      // Usage
      stream = await getChatCompletionStream(
        useStore.getState().apiEndpoint + "/chat/completions",
        inputMessagesLimited,
        completionsConfig,
        headers.headers
      );

      if (headers && stream)    
        await handleStream(stream, addAssistantContent);

      // update tokens used in chatting

      if (currChats && countTotalTokens) {

        const currChatsMessages = JSON.parse(JSON.stringify(useStore.getState().chats))[currentChatIndex].messages;
        
        const [newPromptTokens, newCompletionTokens] = updateTotalTokenUsed(
          currChats[currentChatIndex].config.model,
          inputMessagesLimited,                           // Input Prompt
          currChatsMessages[currChatsMessages.length - 1] // Assistant's response
        );

        // show toast with tokens used

        const { setTokensToastInputTokens, setTokensToastCompletionTokens, setTokensToastShow} = useStore.getState();
  
        setTokensToastInputTokens(newPromptTokens.toString())
        setTokensToastCompletionTokens(newCompletionTokens.toString())
        setTokensToastShow(true)
      }
      
    } catch (e: unknown) {
          const err = (e as Error).message;
          console.log(err);
          setError(err);

          addAssistantContent ("\n***ERROR*** could not obtain AI chat response\nuse the 'Regenerate Response' button to try again");
    }

    if (
      useStore.getState().autoTitle &&
      currChats &&
      !currChats[currentChatIndex]?.titleSet
    )
      generateChatTitle();

    setGenerating(false);
  };



  const generateChatTitle = async () => {

    console.debug('Chat title generation request initiated...');

    const countTotalTokens  = useStore.getState().countTotalTokens;
    const currentChatIndex  = useStore.getState().currentChatIndex;
    const currChats         = useStore.getState().chats;
    const setChats          = useStore.getState().setChats;

    if (!currChats)
    return;

    try {
      const messages_length = currChats[currentChatIndex].messages.length;
      const assistant_message =
        currChats[currentChatIndex].messages[messages_length - 1].content;
      const user_message =
        currChats[currentChatIndex].messages[messages_length - 2].content;
        
        function formatMessage(message: string, maxLength: number) {
          if (message.length <= maxLength) {
            return message;
          } else {
            const firstHalf = message.slice(0, maxLength/2);
            const lastHalf = message.slice(-maxLength/2);
            return `${firstHalf}... ${lastHalf}`;
          }
        }
        
      const titleGenPromptMessage: MessageInterface = {
        role: 'user',
        content: `Generate a title in less than 6 words for the following AI Chatbot Assistance scenario:\n"""\nUser:\n${formatMessage(user_message, 280)}\n\nAssistant:\n${formatMessage(assistant_message, 280)}\n"""`,
      };

      const titleGenModel = supportedModels[currChats[currentChatIndex].config.model].titleGenModel;

      const titleGenConfig: OpenAICompletionsConfig = {
        model: supportedModels[titleGenModel].apiAliasCurrent,
        max_tokens: 100,
        temperature: _defaultChatConfig.temperature,
        presence_penalty: _defaultChatConfig.presence_penalty,
        top_p: _defaultChatConfig.top_p,
        frequency_penalty: _defaultChatConfig.frequency_penalty
      };

      const headers = await prepareApiHeaders(titleGenModel, [titleGenPromptMessage], 'Title Generation');

      let data = await getChatCompletion(
        useStore.getState().apiEndpoint + "/chat/completions",
        [titleGenPromptMessage],
        titleGenConfig,
        headers.headers
      );

      let title = data?.message?.content?.trim();
  
      if (title) // generateTitle function was able to return a non-blank Title
      {
        if (title.startsWith('"') && title.endsWith('"')) {
          title = title.slice(1, -1);
        }

        const updatedChats: ChatInterface[] = JSON.parse(
          JSON.stringify(useStore.getState().chats)
        );
        updatedChats[currentChatIndex].title = title;
        updatedChats[currentChatIndex].titleSet = true;
        setChats(updatedChats);
      }

      console.debug('Chat title succesfully generated: ' + title);

      // update tokens used for generating title
      if (countTotalTokens) {
        updateTotalTokenUsed(titleGenModel, 
          [titleGenPromptMessage], 
          {
            role: 'assistant',
            content: title,
          });
      }

    } catch (e: unknown) {
      const err = 'Error generating chat title! ' + (e as Error).message;
      
      console.error(err);
      
      const { setToastStatus, setToastMessage, setToastShow} = useStore.getState();

      setToastStatus('error');
      setToastMessage(err);
      setToastShow(true);
    }
  }

  return { handleSubmit };
};

export default useSubmit;
