declare module 'react-quill-new' {
    import React from 'react';
    export interface ReactQuillProps {
        theme?: string;
        modules?: any;
        formats?: string[];
        value?: string;
        onChange?: (value: string, delta: any, source: string, editor: any) => void;
        placeholder?: string;
        readOnly?: boolean;
        bounds?: string | HTMLElement;
        scrollingContainer?: string | HTMLElement;
        preserveWhitespace?: boolean;
        header?: string;
        className?: string;
        style?: React.CSSProperties;
    }
    const ReactQuill: React.FC<ReactQuillProps>;
    export default ReactQuill;
}
