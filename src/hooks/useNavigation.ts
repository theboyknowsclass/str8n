import { useRouter } from 'expo-router';
import { useSessionStateStore } from '../stores/useSessionStateStore';
import { isModalPage, Page } from '../types/Pages';
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
      case 'import':
        mode = showSteps ? InstructionMode.ALL : InstructionMode.IMPORT;
        break;
      case 'edit':
        mode = showSteps ? InstructionMode.ALL : InstructionMode.EDIT;
        break;
      case 'export':
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

  const navigate = (page: Page) => {
    switch (page) {
      case 'import':
        router.push('/');
        break;
      case 'edit':
        router.push('/edit');
        break;
      case 'export':
        router.push('/export');
        break;
      case 'transform':
        router.push('/transform');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'instructions': {
        navigateToInstructions();
        break;
      }
      case 'about':
        // About page is not implemented yet, redirect to settings or home
        router.push('/settings');
        break;
      default:
        router.push('/');
    }

    // If the page is not a modal page, set the current page
    if (!isModalPage(page)) {
      setCurrentPage(page);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
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
