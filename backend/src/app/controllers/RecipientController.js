import * as Yup from 'yup';
import { Op } from 'sequelize';
import Recipient from '../models/Recipient';
import Order from '../models/Order';

class RecipientController {
  async index(req, res) {
    const { q = '' } = req.query;

    const recipients = await Recipient.findAll({
      where: {
        name: {
          [Op.iLike]: `%${q}%`,
        },
      },
      attributes: [
        'id',
        'name',
        'street',
        'number',
        'complement',
        'state',
        'city',
        'zip_code',
      ],
    });

    return res.json(recipients);
  }

  async show(req, res) {
		const { id } = req.params;

		const recipient = await Recipient.findByPk(id, {
			attributes: [
				'id',
				'name',
				'street',
				'number',
				'complement',
				'state',
				'city',
				'zip_code',
			],
		});

		if (!recipient) {
			return res.status(400).json({ error: 'Recipient does not exists' });
		}

		return res.json(recipient);
	}

  async store(req, res) {
    /**
     * Validation
     */
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string().required(),
      number: Yup.number().required(),
      complement: Yup.string(),
      state: Yup.string().required(),
      city: Yup.string().required(),
      zip_code: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const {
      id,
      name,
      street,
      number,
      complement,
      state,
      city,
      zip_code,
    } = await Recipient.create(req.body);

    return res.json({
      id,
      name,
      street,
      number,
      complement,
      state,
      city,
      zip_code,
    });
  }

  async update(req, res) {
    /**
     * Validation
     */
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      street: Yup.string().required(),
      number: Yup.number().required(),
      complement: Yup.string(),
      state: Yup.string().required(),
      city: Yup.string().required(),
      zip_code: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    const recipient = await Recipient.findByPk(id);

    /**
     * Check if recipient exists
     */
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient Not Found' })
    }

		const {
			name,
			street,
			number,
			complement,
			state,
			city,
			zip_code,
		} = req.body;

		await recipient.update({
			name,
			street,
			number,
			complement,
			state,
			city,
			zip_code,
		});

    return res.json(recipient);
  }

  async delete(req, res) {
    const { id } = req.params;

    const recipient = await Recipient.findByPk(id);

    if (!recipient) {
      return res.status(400).json({ error: 'Recipient does not exists!' });
    }

    const order = await Order.findOne({
      where: {
        recipient_id: recipient.id,
        signature_id: null
      },
    });

    if (order) {
      return res.status(400).json({ error: 'This Recipient still has an delivery to receive.' })
    }

    await recipient.destroy();
    return res.json({ message: 'Recipient deleted!' });
  }
}

export default new RecipientController();
