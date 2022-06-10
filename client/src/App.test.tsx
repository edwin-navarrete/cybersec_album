// import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { store } from './app/store';
import App from './App';

// FIXME , how to test given the async initial state 
test.skip('renders learn react link', () => {
    const { getByText } = render(
        <Provider store={store}>
            <App />
        </Provider>
    );

    expect(getByText(/Láminas/i)).toBeInTheDocument();
});
