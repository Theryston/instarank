import { BaseError } from '../../errors';
import { GetDataByUsernameDTO } from './dto';
import axios from 'axios';

export async function getDataByUsername({
  requestId,
  username,
}: GetDataByUsernameDTO) {
  try {
    const {
      data: {
        data: { user },
      },
    } = await axios.get(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        headers: {
          'x-ig-app-id': '936619743392459',
        },
      }
    );
    return {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      biography: user.biography,
      profilePicUrl: user.profile_pic_url,
      bio_links: user.bio_links,
      followers: user.edge_followed_by.count,
      following: user.edge_follow.count,
    };
  } catch (error) {
    console.log(error.response.data);
    throw new BaseError({
      message: 'Erro desconhecido ao buscar dados do instagram do usuário',
      requestId,
      statusCode: 500,
      errorLocationCode: 'instagram.getDataByUsername',
    });
  }
}
