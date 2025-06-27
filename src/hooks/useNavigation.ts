import { useRouter } from 'expo-router';
import { useSessionStateStore } from '../stores/useSessionStateStore';
import { Page } from '../types/Pages';
import { InstructionMode } from '../types/InstructionMode';
import { usePageModalContext } from './usePageModalContext';
import { useScreenDimensions } from './useScreenDimensions';

export const useNavigation = () => {
  const router = useRouter();
  const { setCurrentPage, currentPage, startPage } = useSessionStateStore();
  const { setIsModalVisible } = usePageModalContext();
  const { isMobile } = useScreenDimensions();

  const useCustomModal = !isMobile;

  const navigateToInstructions = () => {
    if (useCustomModal) {
      setIsModalVisible(true);
      return;
    }

    // If the current page is the start page, show the step grouping
    const showSteps = currentPage === startPage;

    let mode: InstructionMode | undefined = undefined;

    switch (currentPage) {
      case Page.IMPORT:
        mode = showSteps ? InstructionMode.ALL : InstructionMode.IMPORT;
        break;
      case Page.EDIT:
        mode = showSteps ? InstructionMode.ALL : InstructionMode.EDIT;
        break;
      case Page.EXPORT:
        mode = InstructionMode.EXPORT;
        break;
      default:
        break;
    }

    if (!mode) {
      return;
    }

    // Navigate to instructions with parameters
    const queryParams = `?mode=${mode.toString()}&showSteps=${showSteps.toString()}`;
    router.push(`/instructions${queryParams}`);
  };

  const navigate = (page: Page, params?: Record<string, string>) => {
    switch (page) {
      case Page.IMPORT:
        router.push('/');
        break;
      case Page.EDIT:
        router.push('/edit');
        break;
      case Page.EXPORT:
        router.push('/export');
        break;
      case Page.TRANSFORM:
        router.push('/transform');
        break;
      case Page.SETTINGS:
        router.push('/settings');
        break;
      case Page.INSTRUCTIONS: {
        navigateToInstructions();
        break;
      }
      case Page.ABOUT:
        // About page is not implemented yet, redirect to settings or home
        router.push('/settings');
        break;
      default:
        router.push('/');
    }

    setCurrentPage(page);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      navigate(Page.IMPORT);
    }
  };

  const dismiss = () => {
    router.dismiss();
  };

  return {
    navigate,
    goBack,
    dismiss,
    canGoBack: router.canGoBack,
  };
};
