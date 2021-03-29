import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../components/Header';

import Prismic from '@prismicio/client';
import ApiSearchResponse from '@prismicio/client/types/ApiSearchResponse';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

function mapPostPreview(responseResults): Post {
  return {
    uid: responseResults.uid,
    first_publication_date: responseResults.first_publication_date,
    data: {
      title: responseResults.data.title,
      subtitle: responseResults.data.subtitle,
      author: responseResults.data.author,
    },
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );

  async function handleShowMorePostsButton() {
    const response = await fetch(postsPagination.next_page);
    const responseData: ApiSearchResponse = await response.json();

    const postsLoaded = responseData.results.map(mapPostPreview);

    setNextPage(responseData.next_page);
    setPosts([...posts, ...postsLoaded]);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <Header />

        <section className={styles.content}>
          {
            posts.map(post => (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <article>
                    <h1>{post.data.title}</h1>
                    <p>{post.data.subtitle}</p>
                  
                  <div>
                    <span>
                      <FiCalendar />
                      {
                        format(
                          new Date(post.first_publication_date),
                          "d MMM y",
                          { locale: ptBR, }
                        )
                      }
                    </span>

                    <span>
                      <FiUser />
                      {post.data.author}
                    </span>
                  </div>
                </article>
              </Link>
            ))
          }

          {
            nextPage && 
            <button 
              type="button" 
              onClick={handleShowMorePostsButton}>
              Carregar mais posts
            </button>
          }
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { 
      fetch: ['post.title', 'post.author', 'post.content'],
      pageSize : 2 
    }
  );

  const { results } = postsResponse;
  const next_page = postsResponse.next_page;

  return {
    props: {
      postsPagination: {
        next_page,
        results,
      },
    },
    revalidate: 60 * 60 * 24, // 1 day
  }
};
