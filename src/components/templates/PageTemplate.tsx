import {
  usePageTemplateContext,
  usePageModalContext,
  useScreenDimensions,
} from '@hooks';
import { StyleSheet, View, LayoutChangeEvent, ViewStyle } from 'react-native';
import { LoadingContainer, AnimatedBlurBackground } from '@molecules';
import React, { ReactNode } from 'react';
import {
  PageTemplateContextProvider,
  PageModalContextProvider,
} from '@contexts';
import { NavigationBar } from '@organisms';
import { SafeAreaView } from '@atoms';

/**
 * Props for the PageTemplate component.
 * @property children - React nodes to be rendered within the template
 * @property isLoading - Whether to show loading state (deprecated, use LoadingContainer)
 * @property loadingText - Text to display during loading (deprecated)
 */
interface PageTemplateProps {
  children?: React.ReactNode | React.ReactNode[];
  isLoading?: boolean;
  loadingText?: string;
}

/**
 * Props for the ActionItems compound component.
 * @property children - React nodes to be rendered in the action bar
 */
interface ActionItemsProps {
  children?: React.ReactNode | React.ReactNode[];
}

/**
 * Props for the ModalContent compound component.
 * @property children - React node to be rendered in the modal overlay
 */
interface ModalContentProps {
  children?: React.ReactNode;
}

/**
 * ActionItems compound component for PageTemplate.
 * Renders children in the action bar area of the page template.
 */
const ActionItems: React.FC<ActionItemsProps> = () => null;

/**
 * ModalContent compound component for PageTemplate.
 * Renders children in a modal overlay when visible.
 */
const ModalContent: React.FC<ModalContentProps> = () => null;

/**
 * Type definition for the PageTemplate component with compound components.
 * Includes static ActionItems and ModalContent properties.
 */
interface PageTemplateComponent extends React.FC<PageTemplateProps> {
  ActionItems: React.FC<ActionItemsProps>;
  ModalContent: React.FC<ModalContentProps>;
}

/**
 * Internal Page component that handles the main layout logic.
 *
 * @param props - PageTemplateProps containing children
 * @returns JSX element containing the page layout
 */
const Page: React.FC<PageTemplateProps> = ({ children }) => {
  const { isLandscape } = useScreenDimensions();
  const { setIsReady, setDimensions, isReady } = usePageTemplateContext();

  // Extract action items and modal content from children
  const { otherChildren, actionItems, modalContent } =
    separateChildren(children);

  // responsive styles for orientation
  const contentContainerStyles = [
    styles.contentContainer,
    {
      flexDirection: isLandscape ? 'row' : 'column',
    } as ViewStyle,
  ];

  const actionBarStyles = [
    styles.actionBarBase,
    {
      flexDirection: isLandscape ? 'column' : 'row',
      paddingTop: isLandscape ? 0 : 16,
      paddingLeft: isLandscape ? 16 : 0,
    } as ViewStyle,
  ];

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
    setIsReady(true);
  };

  // child will only ever be one element
  const modalChild = modalContent.length ? modalContent[0] : null;

  return (
    <View style={[styles.rootContainer]}>
      <SafeAreaView style={[contentContainerStyles]}>
        <NavigationBar />
        <View style={styles.mainContent} onLayout={onLayout}>
          <LoadingContainer isReady={isReady}>{otherChildren}</LoadingContainer>
        </View>
        <View style={actionBarStyles}>{actionItems}</View>
      </SafeAreaView>
      <Modal>{modalChild}</Modal>
    </View>
  );
};

/**
 * Modal component that renders content in an animated blur overlay.
 *
 * @param props - ModalContentProps containing children
 * @returns JSX element containing the modal overlay or null
 */
const Modal: React.FC<ModalContentProps> = ({ children }) => {
  const { isModalVisible } = usePageModalContext();

  if (!children) {
    // if no children, don't render anything
    return null;
  }

  return (
    <AnimatedBlurBackground isVisible={isModalVisible}>
      {children}
    </AnimatedBlurBackground>
  );
};

/**
 * PageTemplate component that provides a consistent page layout structure.
 *
 * This compound component provides a standardized page layout with navigation bar,
 * main content area, action bar, and modal support. It automatically handles
 * responsive layout for different orientations and provides context providers
 * for page state management.
 *
 * @param props - PageTemplateProps containing children
 * @returns JSX element containing the complete page template
 *
 * @example
 * ```typescript
 * <PageTemplate>
 *   <PageTemplate.ModalContent>
 *     <InstructionsModal />
 *   </PageTemplate.ModalContent>
 *   <PageTemplate.ActionItems>
 *     <ImagePickerButton />
 *   </PageTemplate.ActionItems>
 *   <MainContent />
 * </PageTemplate>
 * ```
 */
export const PageTemplate: PageTemplateComponent = (props) => {
  return (
    <PageTemplateContextProvider>
      <PageModalContextProvider>
        <Page {...props} />
      </PageModalContextProvider>
    </PageTemplateContextProvider>
  );
};

// Attach ActionItems to the wrapped component
PageTemplate.ActionItems = ActionItems;
PageTemplate.ModalContent = ModalContent;

const styles = StyleSheet.create({
  rootContainer: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    position: 'relative',
  },
  actionBarBase: {
    display: 'flex',
    flexGrow: 0,
    justifyContent: 'space-evenly',
  },
});

/**
 * Separates children into action items, modal content, and other children.
 *
 * @param children - React nodes to be separated
 * @returns Object containing separated actionItems, otherChildren, and modalContent
 */
const separateChildren = (
  children: React.ReactNode
): {
  actionItems: ReactNode[];
  otherChildren: ReactNode[];
  modalContent: ReactNode[];
} => {
  const actionItems: ReactNode[] = [];
  const otherChildren: ReactNode[] = [];
  const modalContent: ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (!child || !React.isValidElement(child)) {
      otherChildren.push(child);
      return;
    }

    const actionItem = getComponentChildren(child, ActionItems);
    const modalContentItem = getComponentChildren(child, ModalContent);

    if (actionItem) {
      actionItems.push(...React.Children.toArray(actionItem));
    } else if (modalContentItem) {
      modalContent.push(...React.Children.toArray(modalContentItem));
    } else {
      otherChildren.push(child);
    }
  });

  return { otherChildren, actionItems, modalContent };
};

const getComponentChildren = <
  T extends React.ComponentType<{ children?: React.ReactNode }>,
>(
  child:
    | React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>
    | React.ReactPortal,
  Component: T
) => {
  const isComponent =
    child.type === Component ||
    (typeof child.type === 'function' && child.type.name === Component.name);

  if (isComponent) {
    const element = child as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return element.props.children;
  }
  return null;
};
