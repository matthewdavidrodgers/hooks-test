import React from "react";
import { act } from "react-dom/test-utils";
import { mount } from "enzyme";
import axios from "axios";
import { useTypeahead } from "./hooks";

let promise = Promise.resolve({ data: ["resultOne", "resultTwo"] });
const getSpy = jest.spyOn(axios, "get").mockImplementation(() => promise);

const isCancelSpy = jest
  .spyOn(axios, "isCancel")
  .mockImplementation(() => false);

const TestTypeahead: React.FC = () => {
  const [state, search] = useTypeahead<string>("/my/typeahead");
  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    search(e.target.value);
  };

  let body: JSX.Element | JSX.Element[] = state.results.map((r, i) => (
    <span key={i}>{r}</span>
  ));
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

test("renders without crashing", async () => {
  let wrapper: any;
  await act(async () => {
    wrapper = mount(<TestTypeahead />);
    await promise;
  });
  wrapper.unmount();
});

test("renders without crashing", async () => {
  await act(async () => {
    const wrapper = mount(<TestTypeahead />);
    await promise;
  });
  expect(getSpy).toBeCalled();
});

test("renders loading until results resolve", async () => {
  let wrapper: any;
  await act(async () => {
    wrapper = mount(<TestTypeahead />);
    expect(wrapper.childAt(0)).toMatchInlineSnapshot(`
                        <div>
                          <input
                            onChange={[Function]}
                            placeholder="search"
                            type="text"
                          />
                          <span>
                            loading...
                          </span>
                        </div>
                `);
    await promise;
  });
  wrapper.update();
  expect(wrapper.childAt(0)).toMatchInlineSnapshot(`
                <div>
                  <input
                    onChange={[Function]}
                    placeholder="search"
                    type="text"
                  />
                  <span
                    key="0"
                  >
                    resultOne
                  </span>
                  <span
                    key="1"
                  >
                    resultTwo
                  </span>
                </div>
        `);
});

test("handles cancellation upon a new request without crashing", async () => {
  const awaitable = Promise.resolve({ data: ["resultOne", "resultTwo"] });
  isCancelSpy.mockImplementationOnce(() => true);
  getSpy
    .mockImplementationOnce(() => Promise.reject("cancel"))
    .mockImplementationOnce(() => awaitable);

  let wrapper: any;
  await act(async () => {
    wrapper = mount(<TestTypeahead />);
    wrapper.find("input").simulate("change", { target: { value: "search" } });

    await awaitable;
  });
  wrapper.update();
  expect(isCancelSpy).toBeCalled();
  expect(wrapper.childAt(0)).toMatchInlineSnapshot(`
            <div>
              <input
                onChange={[Function]}
                placeholder="search"
                type="text"
              />
              <span
                key="0"
              >
                resultOne
              </span>
              <span
                key="1"
              >
                resultTwo
              </span>
            </div>
      `);
});

test("notifies of error on request failure", async () => {
  promise = Promise.reject("failure!");
  const flusher = Promise.resolve();

  let wrapper: any;
  await act(async () => {
    wrapper = mount(<TestTypeahead />);
    await flusher;
  });
  wrapper.update();
  expect(wrapper.childAt(0)).toMatchInlineSnapshot(`
    <div>
      <input
        onChange={[Function]}
        placeholder="search"
        type="text"
      />
      <div>
        <span>
          Error!
        </span>
        <div>
          failure!
        </div>
      </div>
    </div>
  `);
});
