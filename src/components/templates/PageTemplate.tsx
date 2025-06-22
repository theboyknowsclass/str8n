import {
  usePageTemplateContext,
  usePageModalContext,
  useScreenDimensions,
} from '@hooks';
import { StyleSheet, View, LayoutChangeEvent, ViewStyle } from 'react-native';
import {
  LoadingContainer,
  AnimatedBlurBackground,
  ModalDialog,
} from '@molecules';
import React, { ReactNode } from 'react';
import {
  PageTemplateContextProvider,
  PageModalContextProvider,
} from '@contexts';
import { NavigationBar } from '@organisms';

interface PageTemplateProps {
  children?: React.ReactNode | React.ReactNode[];
  isLoading?: boolean;
  loadingText?: string;
}

interface ActionItemsProps {
  children?: React.ReactNode | React.ReactNode[];
}

interface ModalContentProps {
  children?: React.ReactNode;
}

// ActionItems component that will be used as a compound component
const ActionItems: React.FC<ActionItemsProps> = () => null;

const ModalContent: React.FC<ModalContentProps> = () => null;

// Define the type for the PageTemplate component with its static properties
interface PageTemplateComponent extends React.FC<PageTemplateProps> {
  ActionItems: React.FC<ActionItemsProps>;
  ModalContent: React.FC<ModalContentProps>;
}

// Create the Page component
const Page: React.FC<PageTemplateProps> = ({ children }) => {
  const { isLandscape } = useScreenDimensions();
  const { setIsReady, setDimensions, isReady } = usePageTemplateContext();

  // Extract action items and modal content from children
  const { otherChildren, actionItems, modalContent } =
    separateChildren(children);

  // responsive styles for orientation
  const contentContainerStyles = [
    styles.contentContainer,
    { flexDirection: isLandscape ? 'row' : 'column' } as ViewStyle,
  ];

  const actionBarStyles = [
    styles.actionBarBase,
    { flexDirection: isLandscape ? 'column' : 'row' } as ViewStyle,
  ];

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
    setIsReady(true);
  };

  // child will only ever be one element
  const modalChild = modalContent.length ? modalContent[0] : null;

  return (
    <View style={styles.rootContainer}>
      <View style={contentContainerStyles}>
        <NavigationBar />
        <View style={styles.mainContent} onLayout={onLayout}>
          <LoadingContainer isReady={isReady}>{otherChildren}</LoadingContainer>
        </View>
        <View style={actionBarStyles}>{actionItems}</View>
      </View>
      <Modal>{modalChild}</Modal>
    </View>
  );
};

const Modal: React.FC<ModalContentProps> = ({ children }) => {
  const { isModalVisible } = usePageModalContext();

  if (!children) {
    // if no children, don't render anything
    return null;
  }

  return (
    <AnimatedBlurBackground isVisible={isModalVisible}>
      <ModalDialog isVisible={isModalVisible}>{children}</ModalDialog>
    </AnimatedBlurBackground>
  );
};

// Export a wrapped version of Page with PageTemplateContextProvider
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
    margin: 16,
    position: 'relative',
  },
  actionBarBase: {
    display: 'flex',
    flexGrow: 0,
    justifyContent: 'space-evenly',
    padding: 16,
  },
});

// Separate children into action items and other children
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
