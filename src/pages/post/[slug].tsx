import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import Header from '../../components/Header';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const { isFallback } = useRouter();

  if (isFallback) {
    return <div>Carregando...</div>;
  }

  const wordCount = post?.data.content.reduce((accumulator, item) => {
    const sectionWordCount = RichText.asText(item.body).split(' ').length;
    
    return accumulator + sectionWordCount;
  }, 0);
  const readingTime = Math.ceil(wordCount / 200); // 200 is the Average human reading speed assumed

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <div className={commonStyles.container}>
        <Header />
      </div>

      <div
        className={styles.banner}
        style={{ backgroundImage: `url(${post?.data.banner.url})` }}
      />

      <main className={`${commonStyles.container} ${styles.content}`}>
        <h1>{post.data.title}</h1>
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
          <span>
            <FiClock />
            {readingTime} min
          </span>
        </div>

        {
          post?.data.content.map(content => (
            <section key={post.data.title} className={styles.post}>
              <h2>{content.heading}</h2>
              {
                content.body.map(item => (
                  <p key={item.text.substring(0,10)}>{item.text}</p>
                ))
              }
            </section>
          ))
        }
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'posts'),
    { 
      fetch: ['post.title', 'post.banner', 'post.author', 'post.content'],
    }
  );

  const paths = posts?.results.map(post => {
    return {
      params: {
        slug: post.uid,
      }
    }
  });

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const post: Post = await prismic.getByUID("posts", String(slug), {
    fetch: ['post.title', 'post.banner', 'post.author', 'post.content'],
  });

  return {
    props: {
      post
    },
    revalidate: 60 * 60 * 24, // 1 day
  }
};
