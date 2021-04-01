import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { FiCalendar, FiUser, FiClock, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import Comments from '../../components/Comments';
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
  last_publication_date: string | null;
  id: string;
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
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
}

export default function Post({ post, navigation }: PostProps) {
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

          {
            post.last_publication_date && (
              <p>* editado em 
                {
                  format(
                    new Date(post.last_publication_date),
                    " d MMM y', às' HH:mm",
                    { locale: ptBR, }
                  )
                }
              </p>
            )
          }
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

        <footer className={styles.footer}>
          {
            navigation.prevPost.length > 0 && (
              <Link href={navigation.prevPost[0].uid}>
                <a>
                  <FiChevronLeft />
                  <p>{navigation.prevPost[0].data.title}</p>
                  <span>Post anterior</span>
                </a>
              </Link>
            )
          }

          {
            navigation.nextPost.length > 0 && (
              <Link href={navigation.nextPost[0].uid}>
                <a>
                  <FiChevronRight />
                  <p>{navigation.nextPost[0].data.title}</p>
                  <span>Próximo post</span>
                </a>
              </Link>
            )
          }
        </footer>

        <Comments />

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

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: post.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: post.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
    },
    revalidate: 60 * 60 * 24, // 1 day
  }
};
