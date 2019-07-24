import React from "react";
import { render, fireEvent, act, waitForElement } from "@testing-library/react";
import axios from "axios";
import { useTypeahead } from "./hooks";

let promise = Promise.resolve({ data: ["resultOne", "resultTwo"] });
const getSpy = jest.spyOn(axios, "get").mockImplementation(() => promise);

const isCancelSpy = jest.spyOn(axios, "isCancel").mockImplementation(() => false);

const TestTypeahead: React.FC = () => {
  const [state, search] = useTypeahead<string>("/my/typeahead");
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    search(e.target.value);
  };

  let body: JSX.Element | JSX.Element[] = state.results.map((r, i) => <span key={i}>{r}</span>)
  if (state.loading) {
    body = <span>loading...</span>;
  } else if (state.error) {
    body = (
      <div>
        <span>Error!</span>
        <div>{state.error}</div>
      </div>
    );
  }

  return (
    <div>
      <input type="text" placeholder="search" onChange={handleOnChange} />
      {body}
    </div>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  promise = Promise.resolve({ data: ["resultOne", "resultTwo"] });
});

test("can be called without crashing", async () => {
  await act(async () => {
    const { unmount } = render(<TestTypeahead />);
    await promise;
    unmount();
  });
});

test("fires on mount", async () => {
  await act(async () => {
    const { unmount } = render(<TestTypeahead />);
    expect(getSpy).toBeCalled();
    await promise;
    unmount();
  });
});

test("renders loading until results resolve", async () => {
  await act(async () => {
    const { queryByText, unmount } = render(<TestTypeahead />);
    expect(queryByText("loading...")).not.toBe(null);
    await promise;
    expect(queryByText("loading...")).toBe(null);
    unmount();
  });
});

test("handles cancellation without crashing", async () => {
  isCancelSpy.mockImplementationOnce(() => true);
  getSpy
    .mockImplementationOnce(() => Promise.reject("cancel"))
    .mockImplementationOnce(() => Promise.resolve({ data: ["resultOne", "resultTwo"] }));

  await act(async () => {
    const { getByText, getByPlaceholderText, unmount } = render(<TestTypeahead />);
    fireEvent.change(getByPlaceholderText("search"), { target: { value: "new search" } });
    
    const resultsAfterCancellation = await waitForElement(() => getByText("resultOne"));
    expect(resultsAfterCancellation).not.toBeNull();

    unmount();
  });
});

test("notifies of error on request failure", async () => {
  getSpy.mockImplementationOnce(() => Promise.reject("request fail"));

  await act(async () => {
    const { getByText, getByPlaceholderText, unmount } = render(<TestTypeahead />);
    fireEvent.change(getByPlaceholderText("search"), { target: { value: "bad search" } });

    const resultsAfterCancellation = await waitForElement(() => getByText("Error!"));
    expect(resultsAfterCancellation).not.toBeNull();
    expect(getByText("request fail")).not.toBeNull();

    unmount();
  });
});
