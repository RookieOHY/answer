import { useEffect, useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { useParams, useSearchParams } from 'react-router-dom';

import { questionDetail, getAnswers } from '@answer/api';
import { Pagination, PageTitle } from '@answer/components';
import { userInfoStore } from '@answer/stores';
import { scrollTop } from '@answer/utils';
import { usePageUsers } from '@answer/hooks';
import type {
  ListResult,
  QuDetailRes,
  AnswerItem,
} from '@answer/common/interface';

import {
  Question,
  Answer,
  AnswerHead,
  RelatedQuestions,
  WriteAnswer,
  Alert,
} from './components';

import './index.scss';

const Index = () => {
  const { qid = '', aid = '' } = useParams();
  const [urlSearch] = useSearchParams();

  const page = Number(urlSearch.get('page') || 0);
  const order = urlSearch.get('order') || '';
  const [question, setQuestion] = useState<QuDetailRes | null>(null);
  const [answers, setAnswers] = useState<ListResult<AnswerItem>>({
    count: -1,
    list: [],
  });
  const { setUsers } = usePageUsers();
  const userInfo = userInfoStore((state) => state.user);
  const isAuthor = userInfo?.username === question?.user_info?.username;
  const requestAnswers = async () => {
    const res = await getAnswers({
      order: order === 'updated' ? order : 'default',
      question_id: qid,
      page: 1,
      page_size: 999,
    });
    if (res) {
      setAnswers(res);
      if (page > 0 || order) {
        // scroll into view;
        const element = document.getElementById('answerHeader');
        scrollTop(element);
      }

      res.list.forEach((item) => {
        setUsers([item.user_info, item?.update_user_info]);
      });
    }
  };

  const getDetail = async () => {
    const res = await questionDetail(qid);
    if (res) {
      // undo
      setUsers([
        res.user_info,
        res?.update_user_info,
        res?.last_answered_user_info,
      ]);
      setQuestion(res);
    }
  };

  const initPage = (type: string) => {
    if (type === 'delete_question') {
      setTimeout(() => {
        window.history.back();
      }, 1000);
      return;
    }
    requestAnswers();
  };

  const writeAnswerCallback = (obj: AnswerItem) => {
    setAnswers({
      count: answers.count + 1,
      list: [...answers.list, obj],
    });
  };

  useEffect(() => {
    if (!qid) {
      return;
    }
    getDetail();
    requestAnswers();
  }, [qid]);

  useEffect(() => {
    if (page || order) {
      requestAnswers();
    }
  }, [page, order]);

  return (
    <>
      <PageTitle title={question?.title} />
      <Container className="pt-4 mt-2 mb-5">
        <Row className="justify-content-center">
          <Col lg={7}>
            {question?.operation?.operation_type && (
              <Alert data={question.operation} />
            )}
            <Question
              data={question}
              initPage={initPage}
              hasAnswer={answers.count > 0}
            />
            {answers.count > 0 && (
              <>
                <AnswerHead count={answers.count} order={order} />
                {answers?.list?.map((item) => {
                  return (
                    <Answer
                      aid={aid}
                      key={item?.id}
                      data={item}
                      questionTitle={question?.title || ''}
                      isAuthor={isAuthor}
                      callback={initPage}
                    />
                  );
                })}
              </>
            )}

            {Math.ceil(answers.count / 15) > 1 && (
              <div className="d-flex justify-content-center answer-item pt-4">
                <Pagination
                  currentPage={Number(page || 1)}
                  pageSize={15}
                  totalSize={answers?.count || 0}
                />
              </div>
            )}
            {!question?.operation?.operation_type && (
              <WriteAnswer
                visible={answers.count === 0}
                data={{
                  qid,
                  answered: question?.answered,
                }}
                callback={writeAnswerCallback}
              />
            )}
          </Col>
          <Col lg={3}>
            <RelatedQuestions id={question?.id || ''} />
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default Index;
